from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, date, timedelta, timezone
from app.repositories.analytics_repository import interview_report_repo
from app.repositories.interview_repository import interview_repo
from app.repositories.streak_repository import streak_repo
from app.models.database.analytics import InterviewReport, DailyActivity, Recommendation, UserProgress
from app.models.database.interview import Interview
from app.core.exceptions import NotFoundError
from app.ai.recommendation_engine import recommendation_engine

class AnalyticsService:
    async def get_report(self, db: AsyncSession, report_id: UUID, user_id: UUID) -> InterviewReport:
        report = await interview_report_repo.get_by_id(db, report_id)
        if not report or report.user_id != user_id:
            raise NotFoundError("Interview Report")
        return report

    async def get_dashboard_stats(self, db: AsyncSession, user_id: UUID) -> dict:
        result = await db.execute(select(func.count(Interview.id)).filter(Interview.user_id == user_id, Interview.status == "completed"))
        total_interviews = result.scalar() or 0

        result_avg = await db.execute(select(func.avg(InterviewReport.overall_score)).filter(InterviewReport.user_id == user_id))
        avg_score = result_avg.scalar() or 0.0

        stmt = select(InterviewReport).filter(InterviewReport.user_id == user_id).order_by(InterviewReport.created_at.desc()).limit(5)
        recent_result = await db.execute(stmt)
        recent_activity = [
            {
                "id": str(r.id),
                "interview_id": str(r.interview_id),
                "date": r.created_at.isoformat(),
                "score": float(r.overall_score) if r.overall_score else 0.0
            }
            for r in recent_result.scalars().all()
        ]

        streak = await streak_repo.get_by_user_id(db, user_id)
        streak_count = streak.current_streak if streak else 0

        # Gamification data from Profile
        from app.models.database.user import Profile
        prof_res = await db.execute(select(Profile).filter(Profile.user_id == user_id))
        profile = prof_res.scalars().first()
        badges = profile.badges if profile and profile.badges else []
        current_streak = profile.current_streak if profile else 0
        longest_streak = profile.longest_streak if profile else 0

        return {
            "total_interviews": total_interviews,
            "readiness_score": round(avg_score, 2),
            "avg_score": round(avg_score, 2),
            "recent_activity": recent_activity,
            "streak_count": current_streak,  # Use global profile streak
            "badges": badges,
            "longest_streak": longest_streak
        }

    async def get_recommendations(self, db: AsyncSession, user_id: UUID) -> list[dict]:
        stmt = select(Recommendation).filter(Recommendation.user_id == user_id, Recommendation.status == "pending").limit(5)
        result = await db.execute(stmt)
        recs = result.scalars().all()
        
        if not recs:
            latest_interview_stmt = select(InterviewReport).filter(InterviewReport.user_id == user_id).order_by(InterviewReport.created_at.desc()).limit(1)
            latest_res = await db.execute(latest_interview_stmt)
            latest_report = latest_res.scalars().first()
            
            if latest_report and latest_report.weak_areas:
                plan_res = await recommendation_engine.generate_study_plan(latest_report.weak_areas, "Software Engineer")
                if plan_res["status"] == "success":
                    for item in plan_res["plan"]:
                        new_rec = Recommendation(
                            user_id=user_id,
                            interview_id=latest_report.interview_id,
                            weak_area=item.get("topic", "General"),
                            action_plan=[item],
                            status="pending"
                        )
                        db.add(new_rec)
                    await db.commit()
                    
                    stmt2 = select(Recommendation).filter(Recommendation.user_id == user_id, Recommendation.status == "pending").limit(5)
                    result2 = await db.execute(stmt2)
                    recs = result2.scalars().all()

        return [
            {
                "id": str(r.id),
                "weak_area": r.weak_area,
                "action_plan": r.action_plan,
                "status": r.status
            }
            for r in recs
        ]

analytics_service = AnalyticsService()
