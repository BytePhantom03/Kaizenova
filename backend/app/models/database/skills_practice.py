"""
Skills Practice ORM Models

Supports the Personal Skills Development Platform.
All tables are additive — no existing tables are modified.
"""
from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer,
    ForeignKey, Text, Numeric, JSON, Uuid as UUID
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid


# ── Trainer type constants ──────────────────────────────────────────────────
TRAINER_TYPES = (
    "speaking",      # English Speaking Practice
    "fluency",       # Fluency Coach
    "ielts",         # IELTS Speaking Trainer
    "vocabulary",    # Vocabulary Builder
    "grammar",       # Grammar Trainer
    "hr",            # HR Communication (Phase 2)
    "public",        # Public Speaking (Phase 2)
    "email",         # Email Writing (Phase 2)
    "pronunciation", # Pronunciation Trainer (Phase 2)
    "storytelling",  # Storytelling Coach (Phase 2)
    "leadership",    # Leadership Communication (Phase 3)
    "negotiation",   # Negotiation Practice (Phase 3)
    "confidence",    # Confidence Booster (Phase 3)
)

SESSION_STATUS_IN_PROGRESS = "in_progress"
SESSION_STATUS_COMPLETED = "completed"
SESSION_STATUS_ABANDONED = "abandoned"


class SkillSession(Base):
    """
    One complete practice session with an AI trainer.
    Analogous to the Interview table in the existing schema.
    """
    __tablename__ = "skill_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    trainer_type = Column(String(50), nullable=False, index=True)
    topic = Column(String(255), nullable=True)          # topic for fluency / IELTS part
    sub_mode = Column(String(50), nullable=True)        # e.g. ielts_part1 / ielts_part2
    status = Column(String(20), default=SESSION_STATUS_IN_PROGRESS, index=True)
    overall_score = Column(Numeric(5, 2), nullable=True)
    duration_secs = Column(Integer, nullable=True)
    session_config = Column(JSON, nullable=True)        # trainer-specific config
    summary = Column(JSON, nullable=True)               # post-session AI summary
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    turns = relationship(
        "SkillSessionTurn",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="SkillSessionTurn.turn_order",
    )


class SkillSessionTurn(Base):
    """
    One exchange (AI prompt → user response → AI evaluation) inside a session.
    Analogous to the Answer + AnswerScore pair.
    """
    __tablename__ = "skill_session_turns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True), ForeignKey("skill_sessions.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    turn_order = Column(Integer, nullable=False)
    prompt = Column(Text, nullable=False)               # AI question / cue
    user_response = Column(Text, nullable=True)         # transcribed or typed response
    evaluation = Column(JSON, nullable=True)            # full AI evaluation payload
    scores = Column(JSON, nullable=True)                # normalised score dict
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("SkillSession", back_populates="turns")


class SkillProgress(Base):
    """
    Materialised rolling averages per (user, trainer_type).
    Updated after each completed session — never queried on-the-fly.
    Has a UNIQUE constraint on (user_id, trainer_type) for upsert.
    """
    __tablename__ = "skill_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    trainer_type = Column(String(50), nullable=False)
    sessions_count = Column(Integer, default=0)
    avg_score = Column(Numeric(5, 2), nullable=True)
    last_score = Column(Numeric(5, 2), nullable=True)
    best_score = Column(Numeric(5, 2), nullable=True)
    score_trend = Column(JSON, nullable=True)           # list[float] — last 10 scores
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class VocabularyItem(Base):
    """
    Spaced-repetition vocabulary cards per user.
    mastery_level 0-5; next_review_at drives SRS scheduling.
    """
    __tablename__ = "vocabulary_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    word = Column(String(100), nullable=False)
    definition = Column(Text, nullable=True)
    example_sentence = Column(Text, nullable=True)
    difficulty = Column(String(20), default="intermediate")     # beginner / intermediate / advanced
    context_tags = Column(JSON, nullable=True)                  # ["business", "ielts", ...]
    next_review_at = Column(DateTime(timezone=True), nullable=True, index=True)
    review_count = Column(Integer, default=0)
    mastery_level = Column(Integer, default=0)                  # 0–5
    created_at = Column(DateTime(timezone=True), server_default=func.now())
