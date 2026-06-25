from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional
from app.models.schemas.interview_schema import InterviewStartRequest, AnswerSubmitRequest, AnswerFeedbackResponse, QuestionResponse
from app.repositories.interview_repository import interview_repo
from app.repositories.answer_repository import answer_repo, answer_score_repo
from app.repositories.question_repository import question_repo
from app.repositories.analytics_repository import interview_report_repo
from app.models.database.interview import Interview, Answer, AnswerScore
from app.models.database.question import Question
from app.models.database.analytics import Streak, DailyActivity
from app.services.question_service import question_service
from app.ai.evaluation_engine import evaluation_engine
from app.ai.adaptive_engine import adaptive_engine
from app.core.exceptions import InterviewError, NotFoundError
from app.utils.logger import logger


class InterviewService:
    # ──────────────────────────────────────────────────────────────────────────
    # Session Lifecycle
    # ──────────────────────────────────────────────────────────────────────────

    async def start_interview(self, db: AsyncSession, user_id: UUID, request: InterviewStartRequest) -> Interview:
        data = request.model_dump()
        data["user_id"] = user_id
        data["status"] = "in_progress"

        # Map difficulty_setting → starting difficulty level (1–10 scale)
        difficulty_map = {
            "beginner": 3,
            "intermediate": 6,
            "advanced": 9,
        }
        starting_difficulty = difficulty_map.get(request.difficulty_setting, 5)

        data["session_state"] = {
            "asked_questions": [],
            "current_difficulty": starting_difficulty,
            "difficulty_history": [],   # records changes for the report
            "scores_history": [],       # running composite scores for adaptive logic
        }

        return await interview_repo.create(db, data)

    async def get_next_question(self, db: AsyncSession, interview_id: UUID, user_id: UUID) -> Question:
        interview = await interview_repo.get_by_id(db, interview_id)
        if not interview or interview.user_id != user_id:
            raise NotFoundError("Interview")

        if interview.status != "in_progress":
            raise InterviewError("Interview is not in progress")

        state = interview.session_state or {}
        asked_questions = state.get("asked_questions", [])
        current_difficulty = state.get("current_difficulty", 5)

        question = await question_service.get_next_question(
            db,
            domain=interview.domain,
            difficulty=current_difficulty,
            exclude_ids=asked_questions
        )

        if not question:
            raise InterviewError("No more questions available for this domain")

        return question

    # ──────────────────────────────────────────────────────────────────────────
    # Answer Submission — core evaluation loop
    # ──────────────────────────────────────────────────────────────────────────

    async def submit_answer(
        self,
        db: AsyncSession,
        interview_id: UUID,
        user_id: UUID,
        request: AnswerSubmitRequest
    ) -> AnswerFeedbackResponse:

        interview = await interview_repo.get_by_id(db, interview_id)
        if not interview or interview.user_id != user_id:
            raise NotFoundError("Interview")

        question = await question_repo.get_by_id(db, request.question_id)
        if not question:
            raise NotFoundError("Question")

        state = interview.session_state or {
            "asked_questions": [],
            "current_difficulty": 5,
            "difficulty_history": [],
            "scores_history": [],
        }

        # ── Create the Answer record ──────────────────────────────────────────
        sequence_order = len(state.get("asked_questions", [])) + 1
        answer = await answer_repo.create(db, {
            "interview_id": interview_id,
            "question_id": request.question_id,
            "user_id": user_id,
            "sequence_order": sequence_order,
            "answer_text": request.answer_text,
            "audio_url": request.audio_url,
            "duration_secs": request.duration_secs,
            "was_skipped": request.was_skipped,
            "difficulty_at_time": state.get("current_difficulty", 5),
        })

        # ── Handle Skip ───────────────────────────────────────────────────────
        if request.was_skipped:
            state["asked_questions"].append(str(request.question_id))
            # Treat skipped answers as neutral score 50 for adaptive engine
            state.setdefault("scores_history", []).append(50.0)
            await interview_repo.update(db, interview_id, {"session_state": state})

            next_q = None
            if (interview.questions_answered or 0) < 4:
                try:
                    next_q = await self.get_next_question(db, interview_id, user_id)
                except InterviewError:
                    pass

            return AnswerFeedbackResponse(
                composite_score=0.0,
                technical_accuracy=0.0,
                communication=0.0,
                feedback_text="Question skipped.",
                next_question=next_q
            )

        # ── AI Evaluation ─────────────────────────────────────────────────────
        questions_answered_so_far = len(state.get("asked_questions", []))
        eval_result = await evaluation_engine.evaluate_answer(
            question_text=question.question_text,
            expected_answer=question.expected_answer or "",
            candidate_answer=request.answer_text or "",
            audio_file_path=None,
            domain=interview.domain or "General",
            difficulty=state.get("current_difficulty", 5),
            question_number=questions_answered_so_far + 1,
        )

        # ── Persist Score ─────────────────────────────────────────────────────
        await answer_score_repo.create(db, {
            "answer_id": answer.id,
            "interview_id": interview_id,
            "technical_accuracy": eval_result["technical_accuracy"],
            "communication": eval_result["communication"],
            "confidence": eval_result["confidence"],
            "completeness": eval_result["completeness"],
            "grammar": eval_result["grammar"],
            "composite_score": eval_result["composite_score"],
            "correct_concepts": eval_result["correct_concepts"],
            "missing_concepts": eval_result["missing_concepts"],
            "wrong_concepts": eval_result["wrong_concepts"],
            "feedback_text": eval_result["feedback_text"],
            "wpm": eval_result.get("wpm", 0),
            "pause_count": eval_result.get("pause_count", 0),
            "filler_word_count": eval_result.get("filler_word_count", 0),
        })

        # ── Adaptive Difficulty — use last 3 scores in ORDER ─────────────────
        scores_history: list[float] = state.get("scores_history", [])
        scores_history.append(float(eval_result["composite_score"]))
        recent_composites = scores_history[-3:]

        new_difficulty = adaptive_engine.calculate_next_difficulty(
            state.get("current_difficulty", 5),
            recent_composites
        )

        # Track difficulty changes for the report's difficulty_journey
        difficulty_history: list[dict] = state.get("difficulty_history", [])
        if new_difficulty != state.get("current_difficulty", 5):
            difficulty_history.append({
                "question_num": sequence_order,
                "from": state.get("current_difficulty", 5),
                "to": new_difficulty,
            })

        state["asked_questions"].append(str(request.question_id))
        state["current_difficulty"] = new_difficulty
        state["scores_history"] = scores_history
        state["difficulty_history"] = difficulty_history

        questions_answered = (interview.questions_answered or 0) + 1
        await interview_repo.update(db, interview_id, {
            "session_state": state,
            "questions_answered": questions_answered,
        })

        # ── Fetch next question using adaptive follow-up logic ─────────────────
        # Blueprint: if needs_followup → generate a follow-up (deeper drill)
        #            if shows_weakness → explore weakness area
        #            otherwise → get next adaptive question from pool
        next_q = None
        next_q_response = None
        if questions_answered < 5:
            # Prefer LLM-generated follow-up (deep understanding validation per blueprint)
            if eval_result.get("needs_followup") and eval_result.get("followup_question"):
                # Synthetic follow-up question dict
                next_q_response = QuestionResponse(
                    id=question.id,
                    question_text=eval_result["followup_question"],
                    question_type="follow_up",
                    difficulty=state.get("current_difficulty", 5),
                    hints={"parent_question": question.question_text},
                )
            else:
                try:
                    next_q = await self.get_next_question(db, interview_id, user_id)
                    next_q_response = QuestionResponse.model_validate(next_q)
                except InterviewError:
                    pass

        return AnswerFeedbackResponse(
            composite_score=eval_result["composite_score"],
            technical_accuracy=eval_result["technical_accuracy"],
            communication=eval_result["communication"],
            feedback_text=eval_result["feedback_text"],
            correct_concepts=eval_result["correct_concepts"],
            missing_concepts=eval_result["missing_concepts"],
            next_question=next_q_response
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Interview Completion — builds the full analytics report
    # ──────────────────────────────────────────────────────────────────────────

    async def complete_interview(self, db: AsyncSession, interview_id: UUID, user_id: UUID) -> dict:
        interview = await interview_repo.get_by_id(db, interview_id)
        if not interview or interview.user_id != user_id:
            raise NotFoundError("Interview")

        # Idempotency: if already completed or report already exists, return existing report
        existing_stmt = select(interview_report_repo.model).filter(
            interview_report_repo.model.interview_id == interview_id
        )
        existing_result = await db.execute(existing_stmt)
        existing_report = existing_result.scalars().first()
        if existing_report:
            if interview.status != "completed":
                await interview_repo.update(db, interview_id, {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc),
                })
            return {
                "interview_id": str(interview_id),
                "overall_score": float(existing_report.overall_score or 0),
                "report_id": str(existing_report.id),
            }

        # Mark completed
        await interview_repo.update(db, interview_id, {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
        })

        # ── Fetch all AnswerScores in deterministic order ─────────────────────
        scores_stmt = (
            select(AnswerScore)
            .filter(AnswerScore.interview_id == interview_id)
            .order_by(AnswerScore.created_at.asc())
        )
        scores_result = await db.execute(scores_stmt)
        scores = scores_result.scalars().all()

        if not scores:
            return {
                "interview_id": str(interview_id),
                "overall_score": 0.0,
                "report_id": None,
                "message": "Interview completed with no evaluated answers.",
            }

        # ── Compute dimension averages (excluding skipped/zero scores) ────────
        def safe_avg(values: list[float]) -> Optional[float]:
            non_zero = [v for v in values if v and v > 0]
            return round(sum(non_zero) / len(non_zero), 2) if non_zero else None

        technical_scores = [float(s.technical_accuracy) for s in scores if s.technical_accuracy is not None]
        communication_scores = [float(s.communication) for s in scores if s.communication is not None]
        confidence_scores = [float(s.confidence) for s in scores if s.confidence is not None]
        completeness_scores = [float(s.completeness) for s in scores if s.completeness is not None]
        grammar_scores = [float(s.grammar) for s in scores if s.grammar is not None]
        composite_scores = [float(s.composite_score) for s in scores if s.composite_score is not None]

        technical_avg = safe_avg(technical_scores)
        communication_avg = safe_avg(communication_scores)
        confidence_avg = safe_avg(confidence_scores)
        completeness_avg = safe_avg(completeness_scores)
        grammar_avg = safe_avg(grammar_scores)
        overall_score = safe_avg(composite_scores) or 0.0

        # ── Topic/Domain Scores ────────────────────────────────────────────────
        # Build per-question-type breakdown by querying associated questions
        topic_scores: dict = {}
        try:
            answers_stmt = (
                select(Answer, AnswerScore)
                .join(AnswerScore, Answer.id == AnswerScore.answer_id)
                .filter(Answer.interview_id == interview_id)
                .order_by(Answer.sequence_order.asc())
            )
            answers_result = await db.execute(answers_stmt)
            answer_pairs = answers_result.all()

            domain_buckets: dict[str, list[float]] = {}
            for ans, score in answer_pairs:
                if score.composite_score:
                    q_result = await db.execute(
                        select(Question).filter(Question.id == ans.question_id)
                    )
                    q = q_result.scalars().first()
                    domain = getattr(q, "domain", interview.domain or "General") if q else (interview.domain or "General")
                    domain_buckets.setdefault(domain, []).append(float(score.composite_score))

            topic_scores = {
                domain: round(sum(vals) / len(vals), 2)
                for domain, vals in domain_buckets.items()
            }
        except Exception as e:
            logger.warning("topic_score_build_failed", error=str(e))
            topic_scores = {}

        # ── Weak & Strong Areas ────────────────────────────────────────────────
        SCORE_THRESHOLD_WEAK = 60.0
        SCORE_THRESHOLD_STRONG = 75.0

        dimension_map = {
            "Technical Accuracy": technical_avg,
            "Communication": communication_avg,
            "Confidence": confidence_avg,
            "Completeness": completeness_avg,
            "Grammar": grammar_avg,
        }

        weak_areas = [
            dim for dim, score in dimension_map.items()
            if score is not None and score < SCORE_THRESHOLD_WEAK
        ]
        strong_areas = [
            dim for dim, score in dimension_map.items()
            if score is not None and score >= SCORE_THRESHOLD_STRONG
        ]

        # Also add topic-level weak/strong areas
        for topic, score in topic_scores.items():
            if score < SCORE_THRESHOLD_WEAK and topic not in weak_areas:
                weak_areas.append(topic)
            elif score >= SCORE_THRESHOLD_STRONG and topic not in strong_areas:
                strong_areas.append(topic)

        # ── Radar Chart Data ──────────────────────────────────────────────────
        radar_chart_data = {
            "labels": ["Technical", "Communication", "Confidence", "Completeness", "Grammar"],
            "datasets": [
                {
                    "label": "Your Score",
                    "data": [
                        technical_avg or 0,
                        communication_avg or 0,
                        confidence_avg or 0,
                        completeness_avg or 0,
                        grammar_avg or 0,
                    ],
                    "fill": True,
                }
            ]
        }

        # ── Difficulty Journey from session_state ─────────────────────────────
        session_state = interview.session_state or {}
        difficulty_journey = session_state.get("difficulty_history", [])
        # Always include the starting difficulty
        starting = {
            "question_num": 0,
            "from": None,
            "to": session_state.get("current_difficulty", 5),
        }
        full_journey = [starting] + difficulty_journey

        # ── Persist the full InterviewReport ──────────────────────────────────
        report = await interview_report_repo.create(db, {
            "interview_id": interview_id,
            "user_id": user_id,
            "overall_score": overall_score,
            "technical_avg": technical_avg,
            "communication_avg": communication_avg,
            "confidence_avg": confidence_avg,
            "completeness_avg": completeness_avg,
            "grammar_avg": grammar_avg,
            "topic_scores": topic_scores,
            "difficulty_journey": full_journey,
            "weak_areas": weak_areas,
            "strong_areas": strong_areas,
            "radar_chart_data": radar_chart_data,
        })

        # Update overall_score on the Interview row too
        await interview_repo.update(db, interview_id, {"overall_score": overall_score})

        # ── Update Streak ──────────────────────────────────────────────────────
        try:
            await self._update_streak(db, user_id)
        except Exception as e:
            logger.warning("streak_update_failed", error=str(e))

        return {
            "interview_id": str(interview_id),
            "overall_score": overall_score,
            "report_id": str(report.id),
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Private Helpers
    # ──────────────────────────────────────────────────────────────────────────

    async def _update_streak(self, db: AsyncSession, user_id: UUID):
        """Update user streak after interview completion."""
        from datetime import date, timedelta

        streak_result = await db.execute(
            select(Streak).filter(Streak.user_id == user_id)
        )
        streak = streak_result.scalars().first()
        today = datetime.now(timezone.utc).date()

        if not streak:
            streak = Streak(user_id=user_id, current_streak=1, longest_streak=1, last_active_date=today)
            db.add(streak)
            await db.commit()
            return

        # Already updated today — no-op
        if streak.last_active_date == today:
            return

        if streak.last_active_date == today - timedelta(days=1):
            new_current = streak.current_streak + 1
        else:
            new_current = 1

        new_longest = max(streak.longest_streak, new_current)
        streak.current_streak = new_current
        streak.longest_streak = new_longest
        streak.last_active_date = today
        await db.commit()

        # Also log DailyActivity
        activity = DailyActivity(
            user_id=user_id,
            activity_date=today,
            activity_type="interview",
            activity_count=1,
        )
        db.add(activity)
        await db.commit()


interview_service = InterviewService()
