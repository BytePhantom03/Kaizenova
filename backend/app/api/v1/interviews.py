from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.models.schemas.interview_schema import (
    InterviewStartRequest, InterviewResponse, 
    QuestionResponse, AnswerSubmitRequest, AnswerFeedbackResponse
)
from app.services.interview_service import interview_service
from app.core.exceptions import KaizenovaBaseException
from uuid import UUID

router = APIRouter()

@router.post("/start", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def start_interview(
    request: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new mock interview session."""
    try:
        return await interview_service.start_interview(db, current_user.id, request)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/{interview_id}/next-question", response_model=QuestionResponse)
async def get_next_question(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch the next question for an active interview."""
    try:
        return await interview_service.get_next_question(db, interview_id, current_user.id)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/{interview_id}/answer", response_model=AnswerFeedbackResponse)
async def submit_answer(
    interview_id: UUID,
    request: AnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit an answer and receive AI feedback synchronously."""
    try:
        return await interview_service.submit_answer(db, interview_id, current_user.id, request)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/{interview_id}/complete")
async def complete_interview(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """End the interview and generate final score/report."""
    try:
        return await interview_service.complete_interview(db, interview_id, current_user.id)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
