from app.repositories.base_repository import BaseRepository
from app.models.database.interview import Interview
from sqlalchemy.ext.asyncio import AsyncSession

class InterviewRepository(BaseRepository[Interview]):
    def __init__(self):
        super().__init__(Interview)

interview_repo = InterviewRepository()
