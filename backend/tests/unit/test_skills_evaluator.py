"""
Unit tests — Skills Evaluator (skills_evaluator.py)

Tests that:
- _safe_score clamps values correctly
- _extract_json handles markdown fences and raw JSON
- Default fallback result has expected keys
- MAX_TURNS constants are set for all Phase 1 trainers
- Prompt generators return non-empty strings
- Edge cases: empty responses, None topics

These are pure unit tests — no LLM calls (evaluator methods that call LLM
are tested separately in integration tests with mocks).
"""
import pytest
import json
from app.ai.skills_evaluator import (
    skills_evaluator, _safe_score, _extract_json,
    _FALLBACK_EVAL, MAX_TURNS,
)


class TestSafeScore:
    def test_normal_value(self):
        assert _safe_score(75.0) == 75.0

    def test_clamps_above_100(self):
        assert _safe_score(150.0) == 100.0

    def test_clamps_below_0(self):
        assert _safe_score(-10.0) == 0.0

    def test_zero_is_valid(self):
        assert _safe_score(0.0) == 0.0

    def test_100_is_valid(self):
        assert _safe_score(100.0) == 100.0

    def test_none_returns_default(self):
        assert _safe_score(None, default=50.0) == 50.0

    def test_string_number_converted(self):
        assert _safe_score("80.0") == 80.0

    def test_invalid_string_returns_default(self):
        assert _safe_score("not-a-number", default=42.0) == 42.0

    def test_integer_input(self):
        assert _safe_score(65) == 65.0

    def test_boundary_50(self):
        assert _safe_score(50.0) == 50.0


class TestExtractJson:
    def test_raw_json_object(self):
        raw = '{"score": 85, "feedback": "Good"}'
        result = _extract_json(raw)
        assert result["score"] == 85

    def test_json_with_markdown_fence(self):
        raw = '```json\n{"score": 90}\n```'
        result = _extract_json(raw)
        assert result["score"] == 90

    def test_json_with_plain_fence(self):
        raw = '```\n{"score": 70}\n```'
        result = _extract_json(raw)
        assert result["score"] == 70

    def test_nested_json(self):
        raw = '{"band": {"fluency": 7.0, "vocab": 6.5}}'
        result = _extract_json(raw)
        assert result["band"]["fluency"] == 7.0

    def test_invalid_json_raises(self):
        with pytest.raises((json.JSONDecodeError, ValueError)):
            _extract_json("this is not json at all")

    def test_json_with_leading_whitespace(self):
        raw = '   \n  {"key": "value"}  \n  '
        result = _extract_json(raw)
        assert result["key"] == "value"


class TestFallbackEval:
    def test_fallback_has_all_required_keys(self):
        required = {
            "grammar_score", "fluency_score", "vocabulary_score",
            "confidence_score", "coherence_score", "composite_score",
            "mistakes", "suggestions", "ai_feedback", "corrected_version",
        }
        assert required.issubset(set(_FALLBACK_EVAL.keys()))

    def test_fallback_scores_are_50(self):
        # All score values should be 50.0 (neutral fallback)
        score_keys = [k for k in _FALLBACK_EVAL if k.endswith("_score")]
        for k in score_keys:
            assert _FALLBACK_EVAL[k] == 50.0, f"{k} should be 50.0"

    def test_fallback_is_not_empty(self):
        assert len(_FALLBACK_EVAL) > 0

    def test_fallback_mistakes_is_list(self):
        assert isinstance(_FALLBACK_EVAL["mistakes"], list)

    def test_fallback_suggestions_is_list(self):
        assert isinstance(_FALLBACK_EVAL["suggestions"], list)


class TestMaxTurns:
    def test_all_phase1_trainers_have_max_turns(self):
        phase1 = ["speaking", "fluency", "ielts", "grammar", "vocabulary"]
        for t in phase1:
            assert t in MAX_TURNS, f"No MAX_TURNS entry for {t}"

    def test_all_values_are_positive_ints(self):
        for trainer, turns in MAX_TURNS.items():
            assert isinstance(turns, int) and turns > 0, (
                f"{trainer} has invalid MAX_TURNS: {turns}"
            )

    def test_fluency_is_single_turn(self):
        assert MAX_TURNS["fluency"] == 1

    def test_speaking_is_5_turns(self):
        assert MAX_TURNS["speaking"] == 5

    def test_vocabulary_is_10_turns(self):
        assert MAX_TURNS["vocabulary"] == 10


class TestSkillsEvaluatorInstance:
    def test_evaluator_is_singleton(self):
        from app.ai.skills_evaluator import skills_evaluator as ev1
        from app.ai.skills_evaluator import skills_evaluator as ev2
        assert ev1 is ev2

    def test_evaluator_is_skills_evaluator_class(self):
        from app.ai.skills_evaluator import SkillsEvaluator
        assert isinstance(skills_evaluator, SkillsEvaluator)


@pytest.mark.asyncio
class TestPromptGenerators:
    async def test_generate_next_speaking_prompt_returns_string(self):
        prompt = await skills_evaluator.generate_next_speaking_prompt(turn_number=1)
        assert isinstance(prompt, str) and len(prompt) > 0

    async def test_generate_next_speaking_prompt_cycles(self):
        prompts = {
            await skills_evaluator.generate_next_speaking_prompt(i)
            for i in range(1, 6)
        }
        # Should return at least 1 unique prompt
        assert len(prompts) >= 1

    async def test_generate_fluency_topic_beginner(self):
        topic = await skills_evaluator.generate_fluency_topic("beginner")
        assert isinstance(topic, str) and len(topic) > 10

    async def test_generate_fluency_topic_advanced(self):
        topic = await skills_evaluator.generate_fluency_topic("advanced")
        assert isinstance(topic, str) and len(topic) > 10

    async def test_generate_ielts_prompt_part1(self):
        prompt = await skills_evaluator.generate_ielts_prompt("part1")
        assert isinstance(prompt, str) and len(prompt) > 10

    async def test_generate_ielts_prompt_part2(self):
        prompt = await skills_evaluator.generate_ielts_prompt("part2")
        # Part 2 prompts include speaking time instructions
        assert "minute" in prompt.lower() or "speak" in prompt.lower()

    async def test_generate_ielts_prompt_part3(self):
        prompt = await skills_evaluator.generate_ielts_prompt("part3")
        assert isinstance(prompt, str) and len(prompt) > 10

    async def test_generate_fluency_topic_invalid_falls_back(self):
        # Unknown difficulty should fall back to intermediate bank
        topic = await skills_evaluator.generate_fluency_topic("unknown_level")
        assert isinstance(topic, str) and len(topic) > 0
