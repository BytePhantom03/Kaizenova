from app.repositories.base_repository import BaseRepository
from app.models.database.interview import Answer, AnswerScore
from sqlalchemy.ext.asyncio import AsyncSession

class AnswerRepository(BaseRepository[Answer]):
    def __init__(self):
        super().__init__(Answer)

answer_repo = AnswerRepository()

class AnswerScoreRepository(BaseRepository[AnswerScore]):
    def __init__(self):
        super().__init__(AnswerScore)

answer_score_repo = AnswerScoreRepository()
