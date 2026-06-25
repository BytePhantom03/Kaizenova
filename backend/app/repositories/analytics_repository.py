from app.repositories.base_repository import BaseRepository
from app.models.database.analytics import InterviewReport, ReadinessScore, DailyActivity
from sqlalchemy.ext.asyncio import AsyncSession

class InterviewReportRepository(BaseRepository[InterviewReport]):
    def __init__(self):
        super().__init__(InterviewReport)

interview_report_repo = InterviewReportRepository()

class ReadinessScoreRepository(BaseRepository[ReadinessScore]):
    def __init__(self):
        super().__init__(ReadinessScore)

readiness_score_repo = ReadinessScoreRepository()
