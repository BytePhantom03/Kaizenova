"""
Improvement API — AI-powered skill improvement hub endpoints.
All scores are computed from the user's full interview history (not one session).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.services.improvement_service import improvement_service
from app.services.learning_resource_service import learning_resource_service

router = APIRouter()


@router.get("/resources")
async def get_learning_resources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns personalised free learning resources based on the user's
    weak areas across all interviews. Grouped by topic/skill category.
    """
    try:
        return await learning_resource_service.get_resources(db, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/overview")
async def get_improvement_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns aggregated skill scores (from ALL interviews), score trends,
    AI tips, exercise roadmap, and completion timeline for the Growth tab.
    """
    try:
        return await improvement_service.get_overview(db, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{skill}/generate")
async def generate_skill_improvement(
    skill: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    (Re-)generate AI tips and exercise roadmap for a specific skill.
    skill must be one of: communication, confidence, grammar
    """
    if skill not in ("communication", "confidence", "grammar"):
        raise HTTPException(status_code=400, detail="skill must be 'communication', 'confidence', or 'grammar'")
    try:
        return await improvement_service.generate_for_skill(db, current_user.id, skill)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/exercises/{exercise_id}/complete")
async def complete_exercise(
    exercise_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an exercise as completed."""
    try:
        return await improvement_service.complete_exercise(db, current_user.id, exercise_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/exercises/{exercise_id}/uncomplete")
async def uncomplete_exercise(
    exercise_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Un-check a completed exercise (toggle off)."""
    try:
        return await improvement_service.uncomplete_exercise(db, current_user.id, exercise_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
