from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime, timedelta, timezone, date
from app.repositories.streak_repository import streak_repo
from app.models.database.analytics import Streak

class StreakService:
    async def get_streak(self, db: AsyncSession, user_id: UUID) -> dict:
        streak = await streak_repo.get_by_user_id(db, user_id)
        if not streak:
            streak = await streak_repo.create(db, {"user_id": user_id})
            
        return {
            "current_streak": streak.current_streak,
            "longest_streak": streak.longest_streak,
            "last_active_date": streak.last_active_date
        }

    async def update_activity(self, db: AsyncSession, user_id: UUID):
        streak = await streak_repo.get_by_user_id(db, user_id)
        if not streak:
            streak = await streak_repo.create(db, {"user_id": user_id})
            
        today = datetime.now(timezone.utc).date()
        
        if streak.last_active_date == today:
            return
            
        if streak.last_active_date == today - timedelta(days=1):
            new_current = streak.current_streak + 1
        else:
            new_current = 1
            
        new_longest = max(streak.longest_streak, new_current)
        
        await streak_repo.update(db, streak.id, {
            "current_streak": new_current,
            "longest_streak": new_longest,
            "last_active_date": today
        })

streak_service = StreakService()
