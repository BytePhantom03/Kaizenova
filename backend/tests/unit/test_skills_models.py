"""
Unit tests — Skills Practice DB Models

Tests that:
- All model fields default correctly
- TRAINER_TYPES constant is complete and valid
- Session status constants are correct
- Relationships exist on model definitions
"""
import pytest
from app.models.database.skills_practice import (
    SkillSession, SkillSessionTurn, SkillProgress, VocabularyItem,
    TRAINER_TYPES, SESSION_STATUS_IN_PROGRESS,
    SESSION_STATUS_COMPLETED, SESSION_STATUS_ABANDONED,
)


class TestTrainerTypes:
    def test_phase1_trainers_present(self):
        phase1 = {"speaking", "fluency", "ielts", "vocabulary", "grammar"}
        assert phase1.issubset(set(TRAINER_TYPES)), (
            f"Missing Phase 1 trainers: {phase1 - set(TRAINER_TYPES)}"
        )

    def test_phase2_trainers_present(self):
        phase2 = {"hr", "public", "email", "storytelling"}
        assert phase2.issubset(set(TRAINER_TYPES))

    def test_no_duplicate_types(self):
        assert len(TRAINER_TYPES) == len(set(TRAINER_TYPES))

    def test_all_types_are_strings(self):
        for t in TRAINER_TYPES:
            assert isinstance(t, str) and len(t) > 0


class TestSessionStatusConstants:
    def test_in_progress_value(self):
        assert SESSION_STATUS_IN_PROGRESS == "in_progress"

    def test_completed_value(self):
        assert SESSION_STATUS_COMPLETED == "completed"

    def test_abandoned_value(self):
        assert SESSION_STATUS_ABANDONED == "abandoned"

    def test_values_are_unique(self):
        statuses = {SESSION_STATUS_IN_PROGRESS, SESSION_STATUS_COMPLETED, SESSION_STATUS_ABANDONED}
        assert len(statuses) == 3


class TestSkillSessionModel:
    def test_table_name(self):
        assert SkillSession.__tablename__ == "skill_sessions"

    def test_required_columns_exist(self):
        col_names = {c.name for c in SkillSession.__table__.columns}
        required = {"id", "user_id", "trainer_type", "status", "created_at"}
        assert required.issubset(col_names)

    def test_optional_columns_exist(self):
        col_names = {c.name for c in SkillSession.__table__.columns}
        optional = {"topic", "sub_mode", "overall_score", "duration_secs",
                    "session_config", "summary", "completed_at"}
        assert optional.issubset(col_names)

    def test_has_turns_relationship(self):
        assert hasattr(SkillSession, "turns")

    def test_default_status(self):
        col = SkillSession.__table__.columns["status"]
        assert col.default.arg == SESSION_STATUS_IN_PROGRESS


class TestSkillSessionTurnModel:
    def test_table_name(self):
        assert SkillSessionTurn.__tablename__ == "skill_session_turns"

    def test_required_columns_exist(self):
        col_names = {c.name for c in SkillSessionTurn.__table__.columns}
        required = {"id", "session_id", "turn_order", "prompt", "created_at"}
        assert required.issubset(col_names)

    def test_nullable_columns(self):
        col_names = {c.name for c in SkillSessionTurn.__table__.columns}
        nullable = {"user_response", "evaluation", "scores"}
        assert nullable.issubset(col_names)

    def test_has_session_relationship(self):
        assert hasattr(SkillSessionTurn, "session")


class TestSkillProgressModel:
    def test_table_name(self):
        assert SkillProgress.__tablename__ == "skill_progress"

    def test_required_columns_exist(self):
        col_names = {c.name for c in SkillProgress.__table__.columns}
        required = {"id", "user_id", "trainer_type", "sessions_count"}
        assert required.issubset(col_names)

    def test_default_sessions_count(self):
        col = SkillProgress.__table__.columns["sessions_count"]
        assert col.default.arg == 0


class TestVocabularyItemModel:
    def test_table_name(self):
        assert VocabularyItem.__tablename__ == "vocabulary_items"

    def test_required_columns_exist(self):
        col_names = {c.name for c in VocabularyItem.__table__.columns}
        required = {"id", "user_id", "word", "difficulty", "mastery_level",
                    "review_count", "created_at"}
        assert required.issubset(col_names)

    def test_default_difficulty(self):
        col = VocabularyItem.__table__.columns["difficulty"]
        assert col.default.arg == "intermediate"

    def test_default_mastery_level(self):
        col = VocabularyItem.__table__.columns["mastery_level"]
        assert col.default.arg == 0

    def test_default_review_count(self):
        col = VocabularyItem.__table__.columns["review_count"]
        assert col.default.arg == 0
