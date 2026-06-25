from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.models.schemas.profile_schema import ProfileResponse, ProfileUpdate
from app.services.profile_service import profile_service
from app.core.exceptions import KaizenovaBaseException

router = APIRouter()

@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the current user's profile."""
    try:
        return await profile_service.get_profile(db, current_user.id)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update the current user's profile."""
    try:
        return await profile_service.update_profile(db, current_user.id, data)
    except KaizenovaBaseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
