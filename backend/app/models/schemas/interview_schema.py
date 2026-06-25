from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class InterviewStartRequest(BaseModel):
    interview_type: str = Field(..., description="e.g., technical, behavioral, system_design")
    target_role: str
    target_company: Optional[str] = None
    domain: str
    difficulty_setting: str = Field("beginner", description="beginner, intermediate, advanced")
    duration_minutes: int = 30
    resume_id: Optional[UUID] = None

class InterviewResponse(BaseModel):
    id: UUID
    user_id: UUID
    interview_type: str
    status: str
    started_at: datetime
    difficulty_setting: str

    class Config:
        from_attributes = True

class QuestionResponse(BaseModel):
    id: UUID
    question_text: str
    question_type: str
    difficulty: int
    hints: Optional[Dict[str, Any]] = None

class AnswerSubmitRequest(BaseModel):
    question_id: UUID
    answer_text: Optional[str] = None
    audio_url: Optional[str] = None
    duration_secs: Optional[float] = None
    was_skipped: bool = False

class AnswerFeedbackResponse(BaseModel):
    composite_score: float
    technical_accuracy: float
    communication: float
    feedback_text: str
    correct_concepts: List[str] = []
    missing_concepts: List[str] = []
    next_question: Optional[QuestionResponse] = None

class InterviewCompleteResponse(BaseModel):
    interview_id: UUID
    overall_score: float
    report_id: UUID
