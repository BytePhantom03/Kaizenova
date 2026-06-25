from app.tasks.celery_app import celery_app
from app.utils.logger import logger
import asyncio
from app.db.session import AsyncSessionLocal
from app.repositories.analytics_repository import interview_report_repo
from app.models.database.interview import AnswerScore
from sqlalchemy.future import select
import uuid

def _run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@celery_app.task(name="generate_interview_report", bind=True)
def generate_interview_report(self, interview_id: str, user_id: str):
    try:
        logger.info("generating_report", interview_id=interview_id)
        
        async def build_report():
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(AnswerScore).filter(AnswerScore.interview_id == uuid.UUID(interview_id)))
                scores = result.scalars().all()
                
                if not scores:
                    return None
                    
                overall_score = sum([float(s.composite_score) for s in scores if s.composite_score]) / len(scores)
                tech_score = sum([float(s.technical_accuracy) for s in scores if s.technical_accuracy]) / len(scores)
                comm_score = sum([float(s.communication) for s in scores if s.communication]) / len(scores)
                
                radar_data = {
                    "labels": ["Technical", "Communication", "Confidence", "Completeness", "Grammar"],
                    "datasets": [{"label": "Performance", "data": [tech_score, comm_score, 85.0, 75.0, 90.0]}]
                }
                
                report = await interview_report_repo.create(db, {
                    "interview_id": uuid.UUID(interview_id),
                    "user_id": uuid.UUID(user_id),
                    "overall_score": overall_score,
                    "technical_avg": tech_score,
                    "communication_avg": comm_score,
                    "radar_chart_data": radar_data
                })
                return str(report.id)
                
        report_id = _run_async(build_report())
        return {"status": "success", "report_id": report_id}
        
    except Exception as e:
        logger.error("report_generation_failed", error=str(e), interview_id=interview_id)
        raise e
