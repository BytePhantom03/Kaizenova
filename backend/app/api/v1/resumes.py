from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.database.user import User
from app.services.resume_service import resume_service

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a resume file for parsing and storage. Returns parsed metadata including detected difficulty."""
    lower = (file.filename or "").lower()
    if not (lower.endswith(".pdf") or lower.endswith(".docx") or lower.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")

    resume = await resume_service.upload_resume(db, current_user.id, file)
    pd = resume.parsed_data or {}
    return {
        "message": "Resume uploaded and analysed successfully",
        "resume_id": str(resume.id),
        "file_name": resume.file_name,
        "file_url": resume.file_url,
        # Experience analysis results — used by frontend to pre-fill interview setup
        "detected_role": pd.get("detected_role", ""),
        "experience_level": pd.get("experience_level", "intermediate"),
        "experience_years": pd.get("experience_years", 0),
        "key_skills": pd.get("key_skills", []),
        "difficulty_setting": pd.get("difficulty_setting", "intermediate"),
    }
