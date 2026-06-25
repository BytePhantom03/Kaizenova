from app.tasks.celery_app import celery_app
from app.utils.logger import logger
import asyncio
from app.ai.evaluation_engine import evaluation_engine
from app.db.session import AsyncSessionLocal
from app.repositories.answer_repository import answer_score_repo
import uuid

def _run_async(coro):
    # In newer python versions, we might need a new event loop if one is already running,
    # but in celery workers typically no loop is running in the main thread.
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@celery_app.task(name="evaluate_answer_async", bind=True, max_retries=3)
def evaluate_answer_async(self, answer_id: str, interview_id: str, question_text: str, expected_answer: str, candidate_answer: str, audio_file_path: str = None):
    try:
        logger.info("starting_async_evaluation", answer_id=answer_id)
        
        eval_result = _run_async(evaluation_engine.evaluate_answer(
            question_text=question_text,
            expected_answer=expected_answer,
            candidate_answer=candidate_answer,
            audio_file_path=audio_file_path
        ))
        
        async def save_score():
            async with AsyncSessionLocal() as db:
                await answer_score_repo.create(db, {
                    "answer_id": uuid.UUID(answer_id),
                    "interview_id": uuid.UUID(interview_id),
                    "technical_accuracy": eval_result["technical_accuracy"],
                    "communication": eval_result["communication"],
                    "confidence": eval_result["confidence"],
                    "completeness": eval_result["completeness"],
                    "grammar": eval_result["grammar"],
                    "composite_score": eval_result["composite_score"],
                    "correct_concepts": eval_result.get("correct_concepts", []),
                    "missing_concepts": eval_result.get("missing_concepts", []),
                    "wrong_concepts": eval_result.get("wrong_concepts", []),
                    "feedback_text": eval_result.get("feedback_text", "")
                })
        
        _run_async(save_score())
        logger.info("completed_async_evaluation", answer_id=answer_id)
        return {"status": "success", "answer_id": answer_id}
        
    except Exception as e:
        logger.error("async_evaluation_failed", error=str(e), answer_id=answer_id)
        self.retry(exc=e, countdown=2 ** self.request.retries)
