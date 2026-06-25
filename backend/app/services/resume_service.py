from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database.interview import Resume
from app.models.database.user import User
from uuid import UUID
import uuid

class ResumeService:
    async def upload_resume(self, db: AsyncSession, user_id: UUID, file: UploadFile) -> Resume:
        # Mocking S3/GCS upload
        file_url = f"https://storage.kaizenova.com/resumes/{uuid.uuid4()}_{file.filename}"
        
        # Mocking Resume Parsing Service
        parsed_data = {
            "skills": ["Python", "FastAPI", "React", "Docker"],
            "experience_years": 4,
            "education": "B.S. Computer Science"
        }
        
        resume = Resume(
            user_id=user_id,
            file_url=file_url,
            file_name=file.filename,
            parsed_data=parsed_data
        )
        db.add(resume)
        await db.commit()
        await db.refresh(resume)
        
        return resume

resume_service = ResumeService()
