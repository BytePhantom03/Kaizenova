from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Numeric, JSON, Uuid as UUID
from app.db.session import Base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain = Column(String(100), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=True)
    difficulty = Column(Integer, nullable=False)
    question_type = Column(String(50), nullable=True)
    question_text = Column(Text, nullable=False)
    expected_answer = Column(Text, nullable=True)
    key_concepts = Column(JSON, nullable=True)
    hints = Column(JSON, nullable=True)
    company_tags = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    avg_score = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
