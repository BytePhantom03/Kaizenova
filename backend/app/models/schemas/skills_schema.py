"""
Skills Practice — Pydantic Request / Response Schemas

All schemas follow the existing analytics_schema.py conventions:
- from_attributes = True on response models
- Optional fields with sensible defaults
- Strong typing throughout
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.database.skills_practice import TRAINER_TYPES


# ── Validation helpers ──────────────────────────────────────────────────────

VALID_TRAINER_TYPES = set(TRAINER_TYPES)
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}


# ── Session schemas ─────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    trainer_type: str = Field(..., description="One of the supported trainer types")
    topic: Optional[str] = Field(None, max_length=255)
    sub_mode: Optional[str] = Field(None, max_length=50)
    session_config: Optional[Dict[str, Any]] = None

    @field_validator("trainer_type")
    @classmethod
    def validate_trainer_type(cls, v: str) -> str:
        if v not in VALID_TRAINER_TYPES:
            raise ValueError(f"trainer_type must be one of: {sorted(VALID_TRAINER_TYPES)}")
        return v


class SubmitResponseRequest(BaseModel):
    user_response: str = Field(..., min_length=1, max_length=10_000)


class TurnScores(BaseModel):
    grammar: Optional[float] = None
    fluency: Optional[float] = None
    vocabulary: Optional[float] = None
    confidence: Optional[float] = None
    coherence: Optional[float] = None
    pronunciation: Optional[float] = None
    composite: Optional[float] = None


class TurnResponse(BaseModel):
    id: UUID
    session_id: UUID
    turn_order: int
    prompt: str
    user_response: Optional[str] = None
    scores: Optional[TurnScores] = None
    evaluation: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    trainer_type: str
    topic: Optional[str] = None
    sub_mode: Optional[str] = None
    status: str
    overall_score: Optional[float] = None
    duration_secs: Optional[int] = None
    session_config: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    turns: List[TurnResponse] = []

    class Config:
        from_attributes = True


class SessionSummaryResponse(BaseModel):
    """Lightweight session card for history lists."""
    id: UUID
    trainer_type: str
    topic: Optional[str] = None
    status: str
    overall_score: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NextPromptResponse(BaseModel):
    """Response after submitting a turn — includes evaluation + next AI prompt."""
    turn_id: UUID
    evaluation: Dict[str, Any]
    scores: TurnScores
    next_prompt: Optional[str] = None
    is_session_complete: bool = False
    session_id: UUID


class SessionReportResponse(BaseModel):
    session_id: UUID
    trainer_type: str
    topic: Optional[str] = None
    overall_score: float
    dimension_scores: Dict[str, float]
    strengths: List[str]
    weaknesses: List[str]
    ai_feedback: str
    suggestions: List[str]
    improvement_roadmap: List[str]
    turns_count: int
    gamification: Optional[Dict[str, Any]] = None


# ── Progress schemas ─────────────────────────────────────────────────────────

class TrainerProgressResponse(BaseModel):
    trainer_type: str
    sessions_count: int
    level: int = 1
    xp: int = 0
    avg_score: Optional[float] = None
    last_score: Optional[float] = None
    best_score: Optional[float] = None
    score_trend: List[float] = []

    class Config:
        from_attributes = True


class AllProgressResponse(BaseModel):
    trainers: List[TrainerProgressResponse]


# ── Vocabulary schemas ───────────────────────────────────────────────────────

class AddVocabularyRequest(BaseModel):
    word: str = Field(..., min_length=1, max_length=100)
    difficulty: str = Field(default="intermediate")

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        if v not in VALID_DIFFICULTIES:
            raise ValueError(f"difficulty must be one of: {sorted(VALID_DIFFICULTIES)}")
        return v


class ReviewVocabularyRequest(BaseModel):
    remembered: bool


class VocabularyItemResponse(BaseModel):
    id: UUID
    word: str
    definition: Optional[str] = None
    example_sentence: Optional[str] = None
    difficulty: str
    context_tags: Optional[List[str]] = None
    mastery_level: int
    review_count: int
    next_review_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Trainer catalog schema ────────────────────────────────────────────────────

class TrainerInfo(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    phase: int                      # 1 = live, 2/3 = coming soon
    skills_measured: List[str]
    avg_session_minutes: int
