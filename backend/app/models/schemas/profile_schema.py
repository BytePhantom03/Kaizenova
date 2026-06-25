from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from uuid import UUID

class SkillBase(BaseModel):
    name: str
    proficiency: Optional[str] = None

class ProfileBase(BaseModel):
    full_name: str
    education: Optional[str] = None
    experience_level: Optional[str] = Field(None, description="e.g., Entry, Mid, Senior")
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    timezone: str = "UTC"

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    education: Optional[str] = None
    experience_level: Optional[str] = None
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    timezone: Optional[str] = None
    skills: Optional[List[SkillBase]] = None

class ProfileResponse(ProfileBase):
    id: UUID
    user_id: UUID
    profile_complete: int
    skills: List[SkillBase] = []

    class Config:
        from_attributes = True
