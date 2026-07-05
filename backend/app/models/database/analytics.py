from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Numeric, Date, JSON, Uuid as UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
from sqlalchemy.sql import func
import uuid

class InterviewReport(Base):
    __tablename__ = "interview_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    overall_score = Column(Numeric(5, 2), nullable=True)
    technical_avg = Column(Numeric(5, 2), nullable=True)
    communication_avg = Column(Numeric(5, 2), nullable=True)
    confidence_avg = Column(Numeric(5, 2), nullable=True)
    completeness_avg = Column(Numeric(5, 2), nullable=True)
    grammar_avg = Column(Numeric(5, 2), nullable=True)
    topic_scores = Column(JSON, nullable=True)
    difficulty_journey = Column(JSON, nullable=True)
    weak_areas = Column(JSON, nullable=True)
    strong_areas = Column(JSON, nullable=True)
    radar_chart_data = Column(JSON, nullable=True)
    readiness_delta = Column(Numeric(5, 2), nullable=True)
    percentile = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    interview = relationship("Interview", back_populates="report")

class DailyActivity(Base):
    __tablename__ = "daily_activity"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_date = Column(Date, nullable=False)
    activity_type = Column(String(50), nullable=True)
    activity_count = Column(Integer, default=1)
    metadata_ = Column("metadata", JSON, nullable=True) # avoiding reserved keyword conflicts
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Streak(Base):
    __tablename__ = "streaks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)
    freeze_count = Column(Integer, default=0)
    freeze_used_dates = Column(JSON, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_interviews = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    avg_overall_score = Column(Numeric(5, 2), nullable=True)
    avg_technical = Column(Numeric(5, 2), nullable=True)
    avg_communication = Column(Numeric(5, 2), nullable=True)
    avg_confidence = Column(Numeric(5, 2), nullable=True)
    best_score = Column(Numeric(5, 2), nullable=True)
    domain_scores = Column(JSON, nullable=True)
    readiness_score = Column(Numeric(5, 2), default=0)
    readiness_level = Column(String(30), nullable=True)
    interviews_this_week = Column(Integer, default=0)
    interviews_this_month = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=True)
    weak_area = Column(String(255), nullable=False)
    root_cause = Column(Text, nullable=True)
    action_plan = Column(JSON, nullable=True)
    estimated_improvement = Column(Numeric(5, 2), nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

class ReadinessScore(Base):
    __tablename__ = "readiness_scores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Numeric(5, 2), nullable=False)
    technical_component = Column(Numeric(5, 2), nullable=True)
    communication_component = Column(Numeric(5, 2), nullable=True)
    confidence_component = Column(Numeric(5, 2), nullable=True)
    consistency_component = Column(Numeric(5, 2), nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())


class SkillTip(Base):
    """AI-generated improvement tips cached per user per skill."""
    __tablename__ = "skill_tips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill = Column(String(30), nullable=False)          # "communication" | "confidence" | "grammar"
    tip_text = Column(Text, nullable=False)
    tip_order = Column(Integer, default=1)              # 1, 2, 3
    score_at_generation = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SkillExercise(Base):
    """Practice roadmap exercises per user per skill — 3 stages × 3 exercises = 9 total."""
    __tablename__ = "skill_exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill = Column(String(30), nullable=False)          # "communication" | "confidence" | "grammar"
    stage = Column(Integer, nullable=False)             # 1 (Foundations) | 2 (Intermediate) | 3 (Advanced)
    order_in_stage = Column(Integer, nullable=False)    # 1, 2, 3
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), default="easy")    # "easy" | "medium" | "hard"
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

