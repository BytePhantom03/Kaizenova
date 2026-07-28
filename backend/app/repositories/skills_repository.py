"""
Skills Practice Repository

Extends BaseRepository with skills-specific queries.
All queries are scoped by user_id to enforce data isolation.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update as sa_update, and_
from app.repositories.base_repository import BaseRepository
from app.models.database.skills_practice import (
    SkillSession, SkillSessionTurn, SkillProgress, VocabularyItem,
    SESSION_STATUS_IN_PROGRESS,
)


class SkillSessionRepository(BaseRepository[SkillSession]):
    def __init__(self):
        super().__init__(SkillSession)

    async def get_user_session(
        self, db: AsyncSession, session_id: UUID, user_id: UUID
    ) -> Optional[SkillSession]:
        """Fetch a session only if it belongs to the requesting user."""
        result = await db.execute(
            select(SkillSession).where(
                and_(SkillSession.id == session_id, SkillSession.user_id == user_id)
            )
        )
        return result.scalars().first()

    async def get_history(
        self,
        db: AsyncSession,
        user_id: UUID,
        trainer_type: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[SkillSession]:
        stmt = (
            select(SkillSession)
            .where(SkillSession.user_id == user_id)
        )
        if trainer_type:
            stmt = stmt.where(SkillSession.trainer_type == trainer_type)
        stmt = stmt.order_by(SkillSession.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())


class SkillSessionTurnRepository(BaseRepository[SkillSessionTurn]):
    def __init__(self):
        super().__init__(SkillSessionTurn)

    async def get_turns_for_session(
        self, db: AsyncSession, session_id: UUID
    ) -> List[SkillSessionTurn]:
        result = await db.execute(
            select(SkillSessionTurn)
            .where(SkillSessionTurn.session_id == session_id)
            .order_by(SkillSessionTurn.turn_order)
        )
        return list(result.scalars().all())

    async def count_turns(self, db: AsyncSession, session_id: UUID) -> int:
        result = await db.execute(
            select(SkillSessionTurn).where(SkillSessionTurn.session_id == session_id)
        )
        return len(result.scalars().all())


class SkillProgressRepository(BaseRepository[SkillProgress]):
    def __init__(self):
        super().__init__(SkillProgress)

    async def get_for_user_trainer(
        self, db: AsyncSession, user_id: UUID, trainer_type: str
    ) -> Optional[SkillProgress]:
        result = await db.execute(
            select(SkillProgress).where(
                and_(
                    SkillProgress.user_id == user_id,
                    SkillProgress.trainer_type == trainer_type,
                )
            )
        )
        return result.scalars().first()

    async def get_all_for_user(
        self, db: AsyncSession, user_id: UUID
    ) -> List[SkillProgress]:
        result = await db.execute(
            select(SkillProgress).where(SkillProgress.user_id == user_id)
        )
        return list(result.scalars().all())

    async def upsert_progress(
        self,
        db: AsyncSession,
        user_id: UUID,
        trainer_type: str,
        new_score: float,
    ) -> SkillProgress:
        """Update running averages after a completed session."""
        existing = await self.get_for_user_trainer(db, user_id, trainer_type)
        if existing is None:
            return await self.create(db, {
                "user_id": user_id,
                "trainer_type": trainer_type,
                "sessions_count": 1,
                "level": 1,
                "xp": 50,
                "avg_score": new_score,
                "last_score": new_score,
                "best_score": new_score,
                "score_trend": [new_score],
            })

        # Running average
        n = existing.sessions_count or 0
        old_avg = float(existing.avg_score or 0)
        new_avg = round((old_avg * n + new_score) / (n + 1), 2)
        trend = list(existing.score_trend or [])
        trend.append(new_score)
        if len(trend) > 10:
            trend = trend[-10:]

        return await self.update(db, existing.id, {
            "sessions_count": n + 1,
            "avg_score": new_avg,
            "last_score": new_score,
            "best_score": max(float(existing.best_score or 0), new_score),
            "score_trend": trend,
        })


class VocabularyItemRepository(BaseRepository[VocabularyItem]):
    def __init__(self):
        super().__init__(VocabularyItem)

    async def get_due_for_review(
        self, db: AsyncSession, user_id: UUID, limit: int = 10
    ) -> List[VocabularyItem]:
        """Return items whose next_review_at is now or past."""
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(VocabularyItem)
            .where(
                and_(
                    VocabularyItem.user_id == user_id,
                    VocabularyItem.next_review_at <= now,
                )
            )
            .order_by(VocabularyItem.next_review_at)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_all_for_user(
        self, db: AsyncSession, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> List[VocabularyItem]:
        result = await db.execute(
            select(VocabularyItem)
            .where(VocabularyItem.user_id == user_id)
            .order_by(VocabularyItem.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_review(
        self, db: AsyncSession, item_id: UUID, remembered: bool
    ) -> Optional[VocabularyItem]:
        """Apply SM-2-style spaced repetition scheduling."""
        item = await self.get_by_id(db, item_id)
        if not item:
            return None

        now = datetime.now(timezone.utc)
        # Increase mastery on success, decay on failure
        if remembered:
            mastery = min(5, (item.mastery_level or 0) + 1)
        else:
            mastery = max(0, (item.mastery_level or 0) - 1)

        # Interval in days: 1, 2, 4, 8, 16, 32 based on mastery level
        interval_days = 2 ** mastery
        next_review = now + timedelta(days=interval_days)

        return await self.update(db, item_id, {
            "mastery_level": mastery,
            "review_count": (item.review_count or 0) + 1,
            "next_review_at": next_review,
        })


# ── Singleton instances ──────────────────────────────────────────────────────
skill_session_repo = SkillSessionRepository()
skill_turn_repo = SkillSessionTurnRepository()
skill_progress_repo = SkillProgressRepository()
vocabulary_repo = VocabularyItemRepository()
