from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.services.resume_service import resume_service

router = APIRouter()

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a resume file for parsing and storage."""
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")
        
    resume = await resume_service.upload_resume(db, current_user.id, file)
    return {
        "message": "Resume uploaded successfully",
        "resume_id": str(resume.id),
        "file_url": resume.file_url,
        "parsed_data": resume.parsed_data
    }
