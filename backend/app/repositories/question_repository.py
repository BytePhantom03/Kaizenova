from app.repositories.base_repository import BaseRepository
from app.models.database.question import Question
from sqlalchemy.ext.asyncio import AsyncSession

class QuestionRepository(BaseRepository[Question]):
    def __init__(self):
        super().__init__(Question)

question_repo = QuestionRepository()
