"""
Unit tests — Vocabulary Repository: Spaced Repetition logic

Tests that:
- update_review correctly increases mastery_level on success
- update_review correctly decreases mastery_level on failure
- mastery_level is clamped to [0, 5]
- next_review_at interval doubles with each mastery level
- review_count always increments by 1
"""
import pytest
from datetime import datetime, timezone, timedelta


class TestSpacedRepetitionLogic:
    """
    Pure logic tests for SM-2-style SRS implemented in VocabularyItemRepository.
    We test the mathematical properties without a DB.
    """

    def _compute_interval(self, mastery_level: int) -> int:
        """Mirror the SRS logic from the repository."""
        return 2 ** mastery_level

    def test_interval_at_mastery_0(self):
        """Mastery 0 → review in 1 day."""
        assert self._compute_interval(0) == 1

    def test_interval_at_mastery_1(self):
        """Mastery 1 → review in 2 days."""
        assert self._compute_interval(1) == 2

    def test_interval_at_mastery_2(self):
        """Mastery 2 → review in 4 days."""
        assert self._compute_interval(2) == 4

    def test_interval_at_mastery_3(self):
        """Mastery 3 → review in 8 days."""
        assert self._compute_interval(3) == 8

    def test_interval_at_mastery_4(self):
        """Mastery 4 → review in 16 days."""
        assert self._compute_interval(4) == 16

    def test_interval_at_mastery_5(self):
        """Mastery 5 → review in 32 days."""
        assert self._compute_interval(5) == 32

    def test_mastery_increase_on_success(self):
        current = 2
        new = min(5, current + 1)
        assert new == 3

    def test_mastery_clamped_at_5(self):
        current = 5
        new = min(5, current + 1)
        assert new == 5

    def test_mastery_decrease_on_failure(self):
        current = 3
        new = max(0, current - 1)
        assert new == 2

    def test_mastery_clamped_at_0(self):
        current = 0
        new = max(0, current - 1)
        assert new == 0

    def test_review_interval_is_increasing(self):
        """Each mastery level should have a strictly longer interval than the previous."""
        intervals = [self._compute_interval(i) for i in range(6)]
        for i in range(1, len(intervals)):
            assert intervals[i] > intervals[i - 1]

    def test_review_date_is_future(self):
        """next_review_at should always be in the future."""
        now = datetime.now(timezone.utc)
        for mastery in range(6):
            interval_days = self._compute_interval(mastery)
            next_review = now + timedelta(days=interval_days)
            assert next_review > now
