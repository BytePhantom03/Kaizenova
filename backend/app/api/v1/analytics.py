from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.models.schemas.analytics_schema import InterviewReportResponse, DashboardStatsResponse
from app.services.analytics_service import analytics_service
from app.core.exceptions import KaizenovaBaseException

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated stats for the user dashboard."""
    try:
        return await analytics_service.get_dashboard_stats(db, current_user.id)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/reports/{report_id}", response_model=InterviewReportResponse)
async def get_interview_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed report for a specific interview."""
    try:
        return await analytics_service.get_report(db, report_id, current_user.id)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
