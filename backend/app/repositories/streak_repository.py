from app.repositories.base_repository import BaseRepository
from app.models.database.analytics import Streak
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from typing import Optional

class StreakRepository(BaseRepository[Streak]):
    def __init__(self):
        super().__init__(Streak)

    async def get_by_user_id(self, db: AsyncSession, user_id: UUID) -> Optional[Streak]:
        result = await db.execute(select(Streak).filter(Streak.user_id == user_id))
        return result.scalars().first()

streak_repo = StreakRepository()
