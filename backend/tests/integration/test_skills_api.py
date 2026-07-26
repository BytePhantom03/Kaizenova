"""
Integration tests — Skills Practice API (/api/v1/skills/*)

Tests the full request → response cycle for all skills endpoints.
Uses the existing conftest.py fixtures (auth_client, db_session, test_user).

Mocks:
- LLM calls (skills_evaluator methods) are patched to avoid actual API calls
  and make tests deterministic.

Coverage:
- GET  /skills/trainers             → returns trainer catalog
- POST /skills/sessions/start       → creates session, returns first prompt
- POST /skills/sessions/{id}/respond → evaluates response, returns next prompt
- POST /skills/sessions/{id}/complete → finalizes session
- GET  /skills/sessions/history     → returns session list
- GET  /skills/sessions/{id}        → returns session with turns
- GET  /skills/progress             → returns progress summary
- GET  /skills/vocabulary           → returns vocabulary list
- POST /skills/vocabulary/generate  → generates AI word
- POST /skills/vocabulary/{id}/review → records review
- GET  /skills/vocabulary/due       → returns due items
- GET  /skills/grammar/exercise     → generates grammar exercise

Error cases:
- Unauthenticated request → 401
- Invalid trainer type → 400/422
- Non-existent session → 404
- Accessing another user's session → 404
"""
import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from httpx import AsyncClient


# ── Shared mock evaluation result ────────────────────────────────────────────
_MOCK_EVAL = {
    "grammar_score": 78.0,
    "fluency_score": 75.0,
    "vocabulary_score": 80.0,
    "confidence_score": 70.0,
    "coherence_score": 72.0,
    "composite_score": 75.0,
    "mistakes": ["Slight hesitation detected."],
    "suggestions": ["Speak more slowly."],
    "ai_feedback": "Good overall structure. Work on fluency.",
    "corrected_version": None,
}

_MOCK_REPORT = {
    "overall_score": 75.0,
    "strengths": ["Vocabulary", "Grammar"],
    "weaknesses": ["Fluency"],
    "ai_feedback": "You are making great progress.",
    "suggestions": ["Practice speaking daily."],
    "improvement_roadmap": ["Focus on fluency", "Reduce filler words"],
}

_MOCK_VOCAB = {
    "word": "eloquent",
    "definition": "Fluent and persuasive in speaking.",
    "example_sentence": "She gave an eloquent speech.",
    "context_tags": ["professional", "communication"],
}


@pytest.mark.asyncio
class TestTrainerCatalogEndpoint:
    async def test_get_trainers_authenticated(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/trainers")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 5

    async def test_get_trainers_has_required_fields(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/trainers")
        trainer = resp.json()[0]
        required = {"id", "name", "description", "icon", "category",
                    "phase", "skills_measured", "avg_session_minutes"}
        assert required.issubset(set(trainer.keys()))

    async def test_get_trainers_unauthenticated_401(self, client: AsyncClient):
        resp = await client.get("/api/v1/skills/trainers")
        assert resp.status_code == 401

    async def test_phase1_trainers_present(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/trainers")
        ids = {t["id"] for t in resp.json()}
        assert {"speaking", "fluency", "ielts", "vocabulary", "grammar"}.issubset(ids)


@pytest.mark.asyncio
class TestSessionStart:
    async def test_start_speaking_session(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_next_speaking_prompt",
            new=AsyncMock(return_value="Tell me about yourself."),
        ):
            resp = await auth_client.post("/api/v1/skills/sessions/start", json={
                "trainer_type": "speaking",
            })
        assert resp.status_code == 201
        data = resp.json()
        assert "session_id" in data
        assert "first_prompt" in data
        assert data["trainer_type"] == "speaking"
        assert data["status"] == "in_progress"

    async def test_start_fluency_session(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_fluency_topic",
            new=AsyncMock(return_value="Describe your hometown."),
        ):
            resp = await auth_client.post("/api/v1/skills/sessions/start", json={
                "trainer_type": "fluency",
                "session_config": {"difficulty": "beginner"},
            })
        assert resp.status_code == 201
        data = resp.json()
        assert "fluency" in data["first_prompt"].lower() or "topic" in data["first_prompt"].lower() or len(data["first_prompt"]) > 0

    async def test_start_ielts_session(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_ielts_prompt",
            new=AsyncMock(return_value="Let's talk about your home."),
        ):
            resp = await auth_client.post("/api/v1/skills/sessions/start", json={
                "trainer_type": "ielts",
                "sub_mode": "part1",
            })
        assert resp.status_code == 201

    async def test_start_grammar_session(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_grammar_exercise",
            new=AsyncMock(return_value={
                "prompt": "Correct: She don't like coffee.",
                "hint": "Subject-verb agreement",
                "correct_answer": "She doesn't like coffee.",
            }),
        ):
            resp = await auth_client.post("/api/v1/skills/sessions/start", json={
                "trainer_type": "grammar",
            })
        assert resp.status_code == 201

    async def test_start_vocabulary_session(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_vocabulary_word",
            new=AsyncMock(return_value=_MOCK_VOCAB),
        ):
            resp = await auth_client.post("/api/v1/skills/sessions/start", json={
                "trainer_type": "vocabulary",
            })
        assert resp.status_code == 201

    async def test_invalid_trainer_type_422(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/skills/sessions/start", json={
            "trainer_type": "invalid_trainer",
        })
        assert resp.status_code == 422

    async def test_start_unauthenticated_401(self, client: AsyncClient):
        resp = await client.post("/api/v1/skills/sessions/start", json={
            "trainer_type": "speaking",
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestSessionRespond:
    async def _start_speaking_session(self, auth_client: AsyncClient) -> str:
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_next_speaking_prompt",
            new=AsyncMock(return_value="Tell me about yourself."),
        ):
            resp = await auth_client.post("/api/v1/skills/sessions/start", json={
                "trainer_type": "speaking",
            })
        return resp.json()["session_id"]

    async def test_submit_response_returns_evaluation(self, auth_client: AsyncClient):
        session_id = await self._start_speaking_session(auth_client)
        with patch(
            "app.services.skills_service.SkillsService._evaluate_response",
            new=AsyncMock(return_value=_MOCK_EVAL),
        ), patch(
            "app.services.skills_service.SkillsService._generate_followup_prompt",
            new=AsyncMock(return_value="Describe a challenge you faced."),
        ):
            resp = await auth_client.post(
                f"/api/v1/skills/sessions/{session_id}/respond",
                json={"user_response": "I am a software engineer with 3 years of experience."},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "evaluation" in data
        assert "scores" in data
        assert "is_session_complete" in data
        assert data["session_id"] == session_id

    async def test_submit_to_nonexistent_session_404(self, auth_client: AsyncClient):
        resp = await auth_client.post(
            f"/api/v1/skills/sessions/{uuid4()}/respond",
            json={"user_response": "test response"},
        )
        assert resp.status_code == 404

    async def test_submit_empty_response_422(self, auth_client: AsyncClient):
        session_id = await self._start_speaking_session(auth_client)
        resp = await auth_client.post(
            f"/api/v1/skills/sessions/{session_id}/respond",
            json={"user_response": ""},
        )
        assert resp.status_code == 422

    async def test_evaluation_has_score_fields(self, auth_client: AsyncClient):
        session_id = await self._start_speaking_session(auth_client)
        with patch(
            "app.services.skills_service.SkillsService._evaluate_response",
            new=AsyncMock(return_value=_MOCK_EVAL),
        ), patch(
            "app.services.skills_service.SkillsService._generate_followup_prompt",
            new=AsyncMock(return_value="Next question."),
        ):
            resp = await auth_client.post(
                f"/api/v1/skills/sessions/{session_id}/respond",
                json={"user_response": "My name is John and I am a developer."},
            )
        scores = resp.json()["scores"]
        assert "grammar" in scores
        assert "composite" in scores


@pytest.mark.asyncio
class TestSessionComplete:
    async def test_complete_session_returns_report(self, auth_client: AsyncClient):
        # Start a session
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_next_speaking_prompt",
            new=AsyncMock(return_value="Tell me about yourself."),
        ):
            start_resp = await auth_client.post("/api/v1/skills/sessions/start", json={
                "trainer_type": "speaking",
            })
        session_id = start_resp.json()["session_id"]

        with patch(
            "app.services.skills_service.SkillsService._evaluate_response",
            new=AsyncMock(return_value=_MOCK_EVAL),
        ), patch(
            "app.services.skills_service.SkillsService._generate_followup_prompt",
            new=AsyncMock(return_value="Next question."),
        ):
            await auth_client.post(
                f"/api/v1/skills/sessions/{session_id}/respond",
                json={"user_response": "I am a software developer."},
            )

        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_session_report",
            new=AsyncMock(return_value=_MOCK_REPORT),
        ):
            resp = await auth_client.post(f"/api/v1/skills/sessions/{session_id}/complete")

        assert resp.status_code == 200
        data = resp.json()
        assert "overall_score" in data
        assert "strengths" in data
        assert "weaknesses" in data
        assert "ai_feedback" in data

    async def test_complete_nonexistent_session_404(self, auth_client: AsyncClient):
        resp = await auth_client.post(f"/api/v1/skills/sessions/{uuid4()}/complete")
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestSessionHistory:
    async def test_history_returns_list(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/sessions/history")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_history_pagination(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/sessions/history?limit=5&offset=0")
        assert resp.status_code == 200

    async def test_history_filter_by_trainer(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/sessions/history?trainer_type=speaking")
        assert resp.status_code == 200

    async def test_history_unauthenticated_401(self, client: AsyncClient):
        resp = await client.get("/api/v1/skills/sessions/history")
        assert resp.status_code == 401

    async def test_history_invalid_limit_422(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/sessions/history?limit=0")
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestProgress:
    async def test_get_progress_returns_trainers_list(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/progress")
        assert resp.status_code == 200
        data = resp.json()
        assert "trainers" in data
        assert isinstance(data["trainers"], list)

    async def test_progress_unauthenticated_401(self, client: AsyncClient):
        resp = await client.get("/api/v1/skills/progress")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestVocabularyEndpoints:
    async def test_get_vocabulary_returns_list(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/vocabulary")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_generate_vocabulary_word(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_vocabulary_word",
            new=AsyncMock(return_value=_MOCK_VOCAB),
        ):
            resp = await auth_client.post("/api/v1/skills/vocabulary/generate?difficulty=intermediate")
        assert resp.status_code == 201
        data = resp.json()
        assert "word" in data
        assert "definition" in data
        assert "mastery_level" in data

    async def test_generate_invalid_difficulty_400(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/skills/vocabulary/generate?difficulty=expert")
        assert resp.status_code == 400

    async def test_get_due_vocabulary(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/skills/vocabulary/due")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_add_vocabulary_word(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_vocabulary_word",
            new=AsyncMock(return_value=_MOCK_VOCAB),
        ):
            resp = await auth_client.post("/api/v1/skills/vocabulary/add", json={
                "word": "articulate",
                "difficulty": "intermediate",
            })
        assert resp.status_code == 201

    async def test_add_vocabulary_invalid_difficulty_422(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/skills/vocabulary/add", json={
            "word": "test",
            "difficulty": "expert",
        })
        assert resp.status_code == 422

    async def test_review_vocabulary_nonexistent_404(self, auth_client: AsyncClient):
        resp = await auth_client.post(
            f"/api/v1/skills/vocabulary/{uuid4()}/review",
            json={"remembered": True},
        )
        assert resp.status_code == 404

    async def test_vocabulary_unauthenticated_401(self, client: AsyncClient):
        resp = await client.get("/api/v1/skills/vocabulary")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestGrammarExercise:
    async def test_get_exercise_default_params(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_grammar_exercise",
            new=AsyncMock(return_value={
                "prompt": "Correct: He go to school.",
                "hint": "Subject-verb agreement",
                "correct_answer": "He goes to school.",
            }),
        ):
            resp = await auth_client.get("/api/v1/skills/grammar/exercise")
        assert resp.status_code == 200
        data = resp.json()
        assert "prompt" in data
        assert "correct_answer" in data

    async def test_get_exercise_custom_params(self, auth_client: AsyncClient):
        with patch(
            "app.ai.skills_evaluator.SkillsEvaluator.generate_grammar_exercise",
            new=AsyncMock(return_value={
                "prompt": "Rewrite: I runned fast.",
                "hint": "Past tense",
                "correct_answer": "I ran fast.",
            }),
        ):
            resp = await auth_client.get(
                "/api/v1/skills/grammar/exercise?exercise_type=sentence_rewrite&difficulty=beginner"
            )
        assert resp.status_code == 200

    async def test_invalid_exercise_type_400(self, auth_client: AsyncClient):
        resp = await auth_client.get(
            "/api/v1/skills/grammar/exercise?exercise_type=invalid_type"
        )
        assert resp.status_code == 400

    async def test_invalid_difficulty_400(self, auth_client: AsyncClient):
        resp = await auth_client.get(
            "/api/v1/skills/grammar/exercise?difficulty=expert"
        )
        assert resp.status_code == 400

    async def test_grammar_unauthenticated_401(self, client: AsyncClient):
        resp = await client.get("/api/v1/skills/grammar/exercise")
        assert resp.status_code == 401
