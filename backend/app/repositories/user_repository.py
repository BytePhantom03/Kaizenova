from app.repositories.base_repository import BaseRepository
from app.models.database.user import User, Profile, Skill, UserSkill
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from typing import Optional

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

user_repo = UserRepository()

class ProfileRepository(BaseRepository[Profile]):
    def __init__(self):
        super().__init__(Profile)
        
    async def get_by_user_id(self, db: AsyncSession, user_id: UUID) -> Optional[Profile]:
        result = await db.execute(select(Profile).filter(Profile.user_id == user_id))
        return result.scalars().first()

profile_repo = ProfileRepository()
