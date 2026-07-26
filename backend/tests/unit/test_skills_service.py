"""
Unit tests — Skills Service (skills_service.py)

Tests that:
- get_trainer_catalog returns correct structure
- _compute_avg_scores handles empty, partial, and full evaluation lists
- _default_sub_mode returns correct defaults per trainer type
- Trainer catalog has expected Phase 1 trainers marked as phase=1
- Trainer catalog has Phase 2/3 trainers marked appropriately
- Business logic helpers work without DB/LLM
"""
import pytest
from app.services.skills_service import (
    skills_service, TRAINER_CATALOG, _compute_avg_scores,
)


class TestTrainerCatalog:
    def test_catalog_is_list(self):
        catalog = skills_service.get_trainer_catalog()
        assert isinstance(catalog, list)

    def test_catalog_is_non_empty(self):
        catalog = skills_service.get_trainer_catalog()
        assert len(catalog) >= 5  # At minimum Phase 1 trainers

    def test_catalog_has_all_phase1_trainers(self):
        catalog = skills_service.get_trainer_catalog()
        phase1_ids = {t["id"] for t in catalog if t["phase"] == 1}
        expected = {"speaking", "fluency", "ielts", "vocabulary", "grammar"}
        assert expected.issubset(phase1_ids)

    def test_each_trainer_has_required_fields(self):
        required = {"id", "name", "description", "icon", "category",
                    "phase", "skills_measured", "avg_session_minutes"}
        for trainer in TRAINER_CATALOG:
            missing = required - set(trainer.keys())
            assert not missing, f"Trainer {trainer.get('id')} missing: {missing}"

    def test_trainer_ids_are_unique(self):
        ids = [t["id"] for t in TRAINER_CATALOG]
        assert len(ids) == len(set(ids))

    def test_all_phase1_trainers_have_phase_1(self):
        for trainer in TRAINER_CATALOG:
            if trainer["id"] in {"speaking", "fluency", "ielts", "vocabulary", "grammar"}:
                assert trainer["phase"] == 1, (
                    f"Trainer {trainer['id']} should be Phase 1"
                )

    def test_skills_measured_is_non_empty_list(self):
        for trainer in TRAINER_CATALOG:
            assert isinstance(trainer["skills_measured"], list)
            assert len(trainer["skills_measured"]) >= 1, (
                f"Trainer {trainer['id']} has no skills_measured"
            )

    def test_avg_session_minutes_is_positive(self):
        for trainer in TRAINER_CATALOG:
            assert trainer["avg_session_minutes"] > 0

    def test_phase2_trainers_exist(self):
        phase2 = {t["id"] for t in TRAINER_CATALOG if t["phase"] == 2}
        assert len(phase2) >= 3, "Expected at least 3 Phase 2 trainers"

    def test_phase3_trainers_exist(self):
        phase3 = {t["id"] for t in TRAINER_CATALOG if t["phase"] == 3}
        assert len(phase3) >= 1, "Expected at least 1 Phase 3 trainer"

    def test_catalog_returns_same_reference(self):
        """get_trainer_catalog should return same list (no copy overhead)."""
        c1 = skills_service.get_trainer_catalog()
        c2 = skills_service.get_trainer_catalog()
        assert c1 is c2


class TestComputeAvgScores:
    def test_empty_list_returns_empty(self):
        result = _compute_avg_scores([])
        assert result == {}

    def test_single_evaluation(self):
        evals = [{
            "grammar_score": 80.0,
            "fluency_score": 70.0,
            "vocabulary_score": 75.0,
            "confidence_score": 65.0,
            "coherence_score": 72.0,
            "composite_score": 72.4,
        }]
        result = _compute_avg_scores(evals)
        assert result["grammar_score"] == 80.0
        assert result["composite_score"] == 72.4

    def test_multiple_evaluations_averaged(self):
        evals = [
            {"composite_score": 60.0, "grammar_score": 70.0},
            {"composite_score": 80.0, "grammar_score": 90.0},
        ]
        result = _compute_avg_scores(evals)
        assert result["composite_score"] == 70.0
        assert result["grammar_score"] == 80.0

    def test_missing_keys_skipped(self):
        evals = [
            {"grammar_score": 80.0},   # no fluency_score
            {"fluency_score": 70.0},   # no grammar_score
        ]
        result = _compute_avg_scores(evals)
        assert result.get("grammar_score") == 80.0
        assert result.get("fluency_score") == 70.0

    def test_all_none_values_skipped(self):
        evals = [
            {"grammar_score": None, "composite_score": 75.0},
        ]
        result = _compute_avg_scores(evals)
        # grammar_score is None — should not appear in result
        assert "grammar_score" not in result
        assert result["composite_score"] == 75.0

    def test_rounding_to_2_decimals(self):
        evals = [
            {"composite_score": 66.666},
            {"composite_score": 66.667},
        ]
        result = _compute_avg_scores(evals)
        # Should be rounded to 2 decimal places
        assert str(result["composite_score"]).count(".") <= 1
        frac = str(result["composite_score"]).split(".")
        if len(frac) > 1:
            assert len(frac[1]) <= 2

    def test_three_evaluations_averaged(self):
        evals = [
            {"grammar_score": 60.0},
            {"grammar_score": 70.0},
            {"grammar_score": 80.0},
        ]
        result = _compute_avg_scores(evals)
        assert result["grammar_score"] == pytest.approx(70.0, abs=0.01)


class TestDefaultSubMode:
    def test_ielts_defaults_to_part1(self):
        result = skills_service._default_sub_mode("ielts")
        assert result == "part1"

    def test_speaking_has_no_default(self):
        result = skills_service._default_sub_mode("speaking")
        assert result is None

    def test_fluency_has_no_default(self):
        result = skills_service._default_sub_mode("fluency")
        assert result is None

    def test_grammar_has_no_default(self):
        result = skills_service._default_sub_mode("grammar")
        assert result is None

    def test_unknown_type_returns_none(self):
        result = skills_service._default_sub_mode("unknown")
        assert result is None
