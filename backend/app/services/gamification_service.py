import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.database.user import Profile
from app.models.database.skills_practice import SkillProgress

async def calculate_gamification_rewards(db: AsyncSession, user_id: str, trainer_type: str, overall_score: float) -> dict:
    """
    Calculates XP, levels, streaks, and badges after a session completes.
    Updates the database and returns a summary of the rewards earned.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    today = now.date()

    # 1. Update Profile (Streaks & Badges)
    result = await db.execute(select(Profile).filter(Profile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        return {}

    streak_incremented = False
    new_badges = []

    if profile.last_practice_date:
        last_date = profile.last_practice_date.date()
        if last_date == today - datetime.timedelta(days=1):
            profile.current_streak += 1
            streak_incremented = True
        elif last_date < today - datetime.timedelta(days=1):
            profile.current_streak = 1
            streak_incremented = True
        # If it's today, streak remains the same
    else:
        profile.current_streak = 1
        streak_incremented = True

    if profile.current_streak > profile.longest_streak:
        profile.longest_streak = profile.current_streak

    profile.last_practice_date = now

    # Simple Badge Logic
    current_badges = profile.badges or []
    if profile.current_streak >= 3 and "3_day_streak" not in current_badges:
        current_badges.append("3_day_streak")
        new_badges.append("3_day_streak")
    
    if overall_score >= 90 and "high_achiever" not in current_badges:
        current_badges.append("high_achiever")
        new_badges.append("high_achiever")

    # Re-assign to trigger SQLAlchemy JSON mutation detection
    profile.badges = list(current_badges)

    # 2. Update SkillProgress (XP & Level)
    result_sp = await db.execute(
        select(SkillProgress).filter(
            SkillProgress.user_id == user_id,
            SkillProgress.trainer_type == trainer_type
        )
    )
    skill_progress = result_sp.scalars().first()

    xp_gained = 0
    leveled_up = False
    new_level = 1

    if skill_progress:
        # base XP for completing session = 50. Bonus based on score.
        score_val = float(overall_score) if overall_score else 0
        xp_gained = int(50 + (score_val / 2))
        
        current_xp = skill_progress.xp or 0
        current_level = skill_progress.level or 1
        
        new_xp = current_xp + xp_gained
        skill_progress.xp = new_xp
        
        # Simple curve: Level N requires N * 500 total XP
        xp_required_for_next = current_level * 500
        
        if new_xp >= xp_required_for_next:
            skill_progress.level = current_level + 1
            leveled_up = True
            new_level = skill_progress.level

    await db.commit()

    return {
        "xp_gained": xp_gained,
        "leveled_up": leveled_up,
        "new_level": new_level,
        "current_streak": profile.current_streak,
        "streak_incremented": streak_incremented,
        "new_badges": new_badges
    }
