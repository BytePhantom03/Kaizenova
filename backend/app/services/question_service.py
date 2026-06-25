from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.database.question import Question
from typing import Optional
from uuid import UUID


class QuestionService:
    async def get_next_question(
        self,
        db: AsyncSession,
        domain: str,
        difficulty: int,
        exclude_ids: list[str] = None,
    ) -> Optional[Question]:
        """
        Retrieve the next question.
        Priority:
          1. Matching domain + exact difficulty, not yet asked
          2. Matching domain, any difficulty, not yet asked
          3. Any question not yet asked (cross-domain fallback)
          4. Any question (ignore asked — restart pool)
        """
        exclude_ids = exclude_ids or []
        exclude_uuids: list[UUID] = []
        for eid in exclude_ids:
            try:
                exclude_uuids.append(UUID(str(eid)))
            except (ValueError, AttributeError):
                pass

        # 1. Exact match
        stmt = (
            select(Question)
            .filter(
                Question.domain == domain,
                Question.difficulty == difficulty,
                Question.is_active.is_(True),
                Question.id.notin_(exclude_uuids),
            )
            .limit(1)
        )
        result = await db.execute(stmt)
        q = result.scalars().first()
        if q:
            return q

        # 2. Same domain, any difficulty, not asked
        stmt2 = (
            select(Question)
            .filter(
                Question.domain == domain,
                Question.is_active.is_(True),
                Question.id.notin_(exclude_uuids),
            )
            .limit(1)
        )
        result2 = await db.execute(stmt2)
        q2 = result2.scalars().first()
        if q2:
            return q2

        # 3. Any domain, not asked
        stmt3 = (
            select(Question)
            .filter(
                Question.is_active.is_(True),
                Question.id.notin_(exclude_uuids),
            )
            .limit(1)
        )
        result3 = await db.execute(stmt3)
        q3 = result3.scalars().first()
        if q3:
            return q3

        # 4. Total fallback — any question (pool exhausted, allow repeats)
        stmt4 = select(Question).filter(Question.is_active.is_(True)).limit(1)
        result4 = await db.execute(stmt4)
        return result4.scalars().first()


question_service = QuestionService()
