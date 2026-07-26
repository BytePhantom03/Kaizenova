"""
Skills Practice API Router

Follows the exact same pattern as improvement.py and interviews.py:
- get_current_user dependency on all routes
- HTTP status codes are explicit and meaningful
- No internal details leaked in error responses
- Structured logging via the service layer
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.models.schemas.skills_schema import (
    StartSessionRequest, SubmitResponseRequest,
    SessionResponse, SessionSummaryResponse,
    NextPromptResponse, SessionReportResponse,
    TrainerProgressResponse, AllProgressResponse,
    AddVocabularyRequest, ReviewVocabularyRequest,
    VocabularyItemResponse, TrainerInfo,
    TurnScores,
)
from app.services.skills_service import skills_service

router = APIRouter()


# ── Trainer catalog ──────────────────────────────────────────────────────────

@router.get("/trainers", response_model=List[TrainerInfo])
async def list_trainers(
    current_user: User = Depends(get_current_user),
):
    """Return all available trainers with metadata (phase 1 live, 2/3 coming soon)."""
    return skills_service.get_trainer_catalog()


# ── Session lifecycle ────────────────────────────────────────────────────────

@router.post("/sessions/start", status_code=status.HTTP_201_CREATED)
async def start_session(
    body: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new practice session. Returns session ID and first AI prompt."""
    try:
        return await skills_service.start_session(
            db=db,
            user_id=current_user.id,
            trainer_type=body.trainer_type,
            topic=body.topic,
            sub_mode=body.sub_mode,
            session_config=body.session_config,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/sessions/{session_id}/respond")
async def submit_response(
    session_id: UUID,
    body: SubmitResponseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit user response for the current turn.
    Returns evaluation scores, AI feedback, and next prompt (or completion signal).
    """
    try:
        return await skills_service.submit_response(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
            user_response=body.user_response,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/sessions/{session_id}/complete")
async def complete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Finalize a session. Generates the holistic AI report and updates skill progress.
    """
    try:
        return await skills_service.complete_session(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sessions/history", response_model=List[SessionSummaryResponse])
async def get_session_history(
    trainer_type: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated session history, optionally filtered by trainer type."""
    try:
        return await skills_service.get_history(
            db=db, user_id=current_user.id,
            trainer_type=trainer_type, limit=limit, offset=offset,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return a session with all its turns."""
    try:
        result = await skills_service.get_session(db, current_user.id, session_id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found.")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Progress ─────────────────────────────────────────────────────────────────

@router.get("/progress", response_model=AllProgressResponse)
async def get_all_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated skill progress for all trainer types."""
    try:
        records = await skills_service.get_all_progress(db, current_user.id)
        return AllProgressResponse(trainers=[
            TrainerProgressResponse(
                trainer_type=r.trainer_type,
                sessions_count=r.sessions_count or 0,
                avg_score=float(r.avg_score) if r.avg_score else None,
                last_score=float(r.last_score) if r.last_score else None,
                best_score=float(r.best_score) if r.best_score else None,
                score_trend=r.score_trend or [],
            )
            for r in records
        ])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Vocabulary ────────────────────────────────────────────────────────────────

@router.get("/vocabulary", response_model=List[VocabularyItemResponse])
async def get_vocabulary(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the user's vocabulary list."""
    try:
        return await skills_service.get_vocabulary(db, current_user.id, limit, offset)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/vocabulary/due", response_model=List[VocabularyItemResponse])
async def get_due_vocabulary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return vocabulary items due for spaced-repetition review."""
    try:
        return await skills_service.get_due_for_review(db, current_user.id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/vocabulary/add", status_code=status.HTTP_201_CREATED,
             response_model=VocabularyItemResponse)
async def add_vocabulary(
    body: AddVocabularyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a specific word to the user's vocabulary list (AI fills definition/example)."""
    try:
        return await skills_service.add_vocabulary_word(
            db, current_user.id, body.word, body.difficulty
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/vocabulary/generate", status_code=status.HTTP_201_CREATED,
             response_model=VocabularyItemResponse)
async def generate_vocabulary_word(
    difficulty: str = Query("intermediate"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Let AI pick and add a new vocabulary word for the user at given difficulty."""
    if difficulty not in ("beginner", "intermediate", "advanced"):
        raise HTTPException(status_code=400, detail="difficulty must be beginner, intermediate, or advanced")
    try:
        return await skills_service.generate_vocabulary_word_ai(db, current_user.id, difficulty)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/vocabulary/{item_id}/review", response_model=VocabularyItemResponse)
async def review_vocabulary(
    item_id: UUID,
    body: ReviewVocabularyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record a spaced-repetition review result for a vocabulary item."""
    try:
        item = await skills_service.review_vocabulary_word(
            db, current_user.id, item_id, body.remembered
        )
        if not item:
            raise HTTPException(status_code=404, detail="Vocabulary item not found.")
        return item
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Grammar exercise generator ────────────────────────────────────────────────

@router.get("/grammar/exercise")
async def get_grammar_exercise(
    exercise_type: str = Query("error_correction"),
    difficulty: str = Query("intermediate"),
    current_user: User = Depends(get_current_user),
):
    """Generate a single grammar exercise on demand (without starting a full session)."""
    if exercise_type not in ("error_correction", "sentence_rewrite", "fill_blank"):
        raise HTTPException(
            status_code=400,
            detail="exercise_type must be error_correction, sentence_rewrite, or fill_blank"
        )
    if difficulty not in ("beginner", "intermediate", "advanced"):
        raise HTTPException(status_code=400, detail="difficulty must be beginner, intermediate, or advanced")
    try:
        return await skills_service.generate_grammar_exercise(exercise_type, difficulty)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
