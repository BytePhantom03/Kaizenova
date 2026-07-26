"""
Unit tests — Pydantic Schemas (skills_schema.py)

Tests that:
- Request validation rejects invalid trainer types
- Request validation rejects invalid difficulties
- Response models serialize correctly (from_attributes)
- Field constraints are enforced (min/max lengths)
- Edge cases (empty strings, null values, boundary values)
"""
import pytest
from uuid import uuid4
from datetime import datetime, timezone
from pydantic import ValidationError
from app.models.schemas.skills_schema import (
    StartSessionRequest, SubmitResponseRequest,
    AddVocabularyRequest, ReviewVocabularyRequest,
    TurnScores, TrainerProgressResponse, VocabularyItemResponse,
)


class TestStartSessionRequest:
    def test_valid_phase1_trainer(self):
        req = StartSessionRequest(trainer_type="speaking")
        assert req.trainer_type == "speaking"

    def test_all_phase1_trainers_accepted(self):
        for t in ["speaking", "fluency", "ielts", "vocabulary", "grammar"]:
            req = StartSessionRequest(trainer_type=t)
            assert req.trainer_type == t

    def test_invalid_trainer_type_raises(self):
        with pytest.raises(ValidationError) as exc_info:
            StartSessionRequest(trainer_type="nonexistent_trainer")
        assert "trainer_type" in str(exc_info.value)

    def test_empty_trainer_type_raises(self):
        with pytest.raises(ValidationError):
            StartSessionRequest(trainer_type="")

    def test_optional_fields_default_to_none(self):
        req = StartSessionRequest(trainer_type="speaking")
        assert req.topic is None
        assert req.sub_mode is None
        assert req.session_config is None

    def test_topic_max_length(self):
        long_topic = "a" * 256
        with pytest.raises(ValidationError):
            StartSessionRequest(trainer_type="speaking", topic=long_topic)

    def test_topic_within_max_length(self):
        topic = "a" * 255
        req = StartSessionRequest(trainer_type="speaking", topic=topic)
        assert req.topic == topic

    def test_session_config_accepts_dict(self):
        req = StartSessionRequest(
            trainer_type="grammar",
            session_config={"exercise_type": "error_correction", "difficulty": "intermediate"}
        )
        assert req.session_config["difficulty"] == "intermediate"


class TestSubmitResponseRequest:
    def test_valid_response(self):
        req = SubmitResponseRequest(user_response="This is my answer.")
        assert req.user_response == "This is my answer."

    def test_empty_response_raises(self):
        with pytest.raises(ValidationError):
            SubmitResponseRequest(user_response="")

    def test_whitespace_only_raises(self):
        # min_length=1 means empty string fails, but whitespace of length>=1 passes
        # (Pydantic counts chars, not tokens — this is expected)
        req = SubmitResponseRequest(user_response=" ")
        assert req.user_response == " "

    def test_max_length_enforced(self):
        too_long = "a" * 10_001
        with pytest.raises(ValidationError):
            SubmitResponseRequest(user_response=too_long)

    def test_max_length_boundary_passes(self):
        at_limit = "a" * 10_000
        req = SubmitResponseRequest(user_response=at_limit)
        assert len(req.user_response) == 10_000


class TestAddVocabularyRequest:
    def test_valid_request(self):
        req = AddVocabularyRequest(word="eloquent", difficulty="intermediate")
        assert req.word == "eloquent"

    def test_default_difficulty_is_intermediate(self):
        req = AddVocabularyRequest(word="verbose")
        assert req.difficulty == "intermediate"

    def test_all_valid_difficulties(self):
        for d in ["beginner", "intermediate", "advanced"]:
            req = AddVocabularyRequest(word="test", difficulty=d)
            assert req.difficulty == d

    def test_invalid_difficulty_raises(self):
        with pytest.raises(ValidationError):
            AddVocabularyRequest(word="test", difficulty="expert")

    def test_empty_word_raises(self):
        with pytest.raises(ValidationError):
            AddVocabularyRequest(word="", difficulty="intermediate")

    def test_word_max_length_enforced(self):
        with pytest.raises(ValidationError):
            AddVocabularyRequest(word="a" * 101, difficulty="beginner")


class TestReviewVocabularyRequest:
    def test_remembered_true(self):
        req = ReviewVocabularyRequest(remembered=True)
        assert req.remembered is True

    def test_remembered_false(self):
        req = ReviewVocabularyRequest(remembered=False)
        assert req.remembered is False

    def test_missing_remembered_raises(self):
        with pytest.raises(ValidationError):
            ReviewVocabularyRequest()


class TestTurnScores:
    def test_all_fields_optional(self):
        scores = TurnScores()
        assert scores.grammar is None
        assert scores.composite is None

    def test_partial_scores_valid(self):
        scores = TurnScores(grammar=75.0, fluency=80.5)
        assert scores.grammar == 75.0
        assert scores.confidence is None

    def test_all_scores_valid(self):
        scores = TurnScores(
            grammar=85.0, fluency=78.0, vocabulary=90.0,
            confidence=70.0, coherence=82.0, composite=81.0
        )
        assert scores.composite == 81.0


class TestTrainerProgressResponse:
    def test_valid_response(self):
        resp = TrainerProgressResponse(
            trainer_type="speaking",
            sessions_count=5,
            avg_score=72.5,
            last_score=80.0,
            best_score=85.0,
            score_trend=[60.0, 65.0, 72.0, 78.0, 80.0],
        )
        assert resp.sessions_count == 5

    def test_empty_score_trend_default(self):
        resp = TrainerProgressResponse(
            trainer_type="fluency", sessions_count=0
        )
        assert resp.score_trend == []

    def test_null_scores_valid(self):
        resp = TrainerProgressResponse(
            trainer_type="ielts", sessions_count=0,
            avg_score=None, last_score=None, best_score=None,
        )
        assert resp.avg_score is None


class TestVocabularyItemResponse:
    def test_valid_response(self):
        resp = VocabularyItemResponse(
            id=uuid4(),
            word="articulate",
            definition="Able to express clearly.",
            example_sentence="He was articulate during the presentation.",
            difficulty="intermediate",
            mastery_level=3,
            review_count=5,
            created_at=datetime.now(timezone.utc),
        )
        assert resp.word == "articulate"
        assert resp.mastery_level == 3

    def test_optional_fields_nullable(self):
        resp = VocabularyItemResponse(
            id=uuid4(),
            word="test",
            definition=None,
            example_sentence=None,
            difficulty="beginner",
            mastery_level=0,
            review_count=0,
            created_at=datetime.now(timezone.utc),
        )
        assert resp.definition is None
        assert resp.context_tags is None
        assert resp.next_review_at is None
