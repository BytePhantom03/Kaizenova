from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete as sa_delete
from app.repositories.user_repository import profile_repo
from app.models.database.user import Profile, Skill, UserSkill
from app.models.schemas.profile_schema import ProfileUpdate
from app.core.exceptions import NotFoundError
from uuid import UUID
from typing import List

class ProfileService:
    async def get_profile(self, db: AsyncSession, user_id: UUID) -> dict:
        profile = await profile_repo.get_by_user_id(db, user_id)
        if not profile:
            raise NotFoundError("Profile")
            
        skills_result = await db.execute(select(UserSkill).filter(UserSkill.user_id == user_id))
        user_skills = skills_result.scalars().all()
        
        profile_dict = {
            "id": profile.id,
            "user_id": profile.user_id,
            "full_name": profile.full_name,
            "education": profile.education,
            "experience_level": profile.experience_level,
            "target_role": profile.target_role,
            "target_company": profile.target_company,
            "bio": profile.bio,
            "avatar_url": profile.avatar_url,
            "linkedin_url": profile.linkedin_url,
            "github_url": profile.github_url,
            "timezone": profile.timezone,
            "profile_complete": profile.profile_complete,
            "skills": []
        }
        
        if user_skills:
            skill_ids = [us.skill_id for us in user_skills]
            actual_skills_result = await db.execute(select(Skill).filter(Skill.id.in_(skill_ids)))
            actual_skills = {s.id: s.name for s in actual_skills_result.scalars().all()}
            profile_dict["skills"] = [
                {"name": actual_skills.get(us.skill_id, ""), "proficiency": us.proficiency}
                for us in user_skills
            ]
        
        return profile_dict

    async def update_profile(self, db: AsyncSession, user_id: UUID, data: ProfileUpdate) -> dict:
        profile = await profile_repo.get_by_user_id(db, user_id)
        if not profile:
            raise NotFoundError("Profile")
            
        update_data = data.model_dump(exclude_unset=True)
        skills_data = update_data.pop("skills", None)
        
        if update_data:
            await profile_repo.update(db, profile.id, update_data)
            
        if skills_data is not None:
            await db.execute(sa_delete(UserSkill).where(UserSkill.user_id == user_id))
            
            for skill_in in skills_data:
                skill_result = await db.execute(select(Skill).filter(Skill.name == skill_in["name"]))
                skill = skill_result.scalars().first()
                if not skill:
                    skill = Skill(name=skill_in["name"])
                    db.add(skill)
                    await db.commit()
                    await db.refresh(skill)
                    
                user_skill = UserSkill(user_id=user_id, skill_id=skill.id, proficiency=skill_in.get("proficiency"))
                db.add(user_skill)
            
            await db.commit()
        
        return await self.get_profile(db, user_id)

profile_service = ProfileService()
