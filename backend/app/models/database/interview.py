from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Numeric, JSON, Uuid as UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
from sqlalchemy.sql import func
import uuid

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=True)
    parsed_data = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    interview_type = Column(String(50), nullable=False)
    difficulty_setting = Column(String(20), nullable=False)
    target_role = Column(String(255), nullable=True)
    target_company = Column(String(255), nullable=True)
    domain = Column(String(100), nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    status = Column(String(20), default="in_progress", index=True)
    session_state = Column(JSON, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_questions = Column(Integer, default=0)
    questions_answered = Column(Integer, default=0)
    overall_score = Column(Numeric(5, 2), nullable=True)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    answers = relationship("Answer", back_populates="interview", cascade="all, delete-orphan")
    report = relationship("InterviewReport", back_populates="interview", uselist=False, cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    sequence_order = Column(Integer, nullable=False)
    answer_text = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    duration_secs = Column(Numeric(6, 2), nullable=True)
    was_skipped = Column(Boolean, default=False)
    difficulty_at_time = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    interview = relationship("Interview", back_populates="answers")
    score = relationship("AnswerScore", back_populates="answer", uselist=False, cascade="all, delete-orphan")
    question = relationship("Question")

class AnswerScore(Base):
    __tablename__ = "answer_scores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    answer_id = Column(UUID(as_uuid=True), ForeignKey("answers.id", ondelete="CASCADE"), unique=True, nullable=False)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, index=True)
    technical_accuracy = Column(Numeric(5, 2), nullable=True)
    communication = Column(Numeric(5, 2), nullable=True)
    confidence = Column(Numeric(5, 2), nullable=True)
    completeness = Column(Numeric(5, 2), nullable=True)
    grammar = Column(Numeric(5, 2), nullable=True)
    fluency = Column(Numeric(5, 2), nullable=True)
    composite_score = Column(Numeric(5, 2), nullable=True)
    correct_concepts = Column(JSON, nullable=True)
    missing_concepts = Column(JSON, nullable=True)
    wrong_concepts = Column(JSON, nullable=True)
    feedback_text = Column(Text, nullable=True)
    wpm = Column(Numeric(6, 2), nullable=True)
    pause_count = Column(Integer, nullable=True)
    filler_word_count = Column(Integer, nullable=True)
    filler_words_detected = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    answer = relationship("Answer", back_populates="score")
