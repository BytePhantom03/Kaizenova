from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.models.schemas.analytics_schema import StreakResponse
from app.services.streak_service import streak_service
from app.core.exceptions import KaizenovaBaseException

router = APIRouter()

@router.get("/me", response_model=StreakResponse)
async def get_my_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user streak."""
    try:
        return await streak_service.get_streak(db, current_user.id)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/log-activity")
async def log_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Log an activity to maintain the streak."""
    try:
        await streak_service.update_activity(db, current_user.id)
        return {"message": "Activity logged successfully"}
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
