from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.models.schemas.analytics_schema import RecommendationResponse
from app.services.analytics_service import analytics_service
from app.core.exceptions import KaizenovaBaseException

router = APIRouter()

@router.get("/me", response_model=List[RecommendationResponse])
async def get_my_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get personalized study recommendations."""
    try:
        return await analytics_service.get_recommendations(db, current_user.id)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
