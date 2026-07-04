"""
Resume Service — In-memory resume parsing (PDF + DOCX).

Parses the uploaded file entirely in-memory (no disk I/O) and stores
the extracted full text in the `parsed_data` JSON column so the AI
engine can use it to personalise interview questions.
"""
import io
import uuid
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database.interview import Resume
from uuid import UUID
from app.utils.logger import logger


def _extract_text_from_pdf(content: bytes) -> str:
    """Extract all text from a PDF using pypdf (pure-Python, no C deps)."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                parts.append(text.strip())
        return "\n\n".join(parts)
    except Exception as e:
        logger.error("pdf_parse_error", error=str(e))
        return ""


def _extract_text_from_docx(content: bytes) -> str:
    """Extract all text from a DOCX using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        parts = [para.text.strip() for para in doc.paragraphs if para.text.strip()]
        return "\n\n".join(parts)
    except Exception as e:
        logger.error("docx_parse_error", error=str(e))
        return ""


def _extract_text_from_txt(content: bytes) -> str:
    """Decode plain-text files."""
    try:
        return content.decode("utf-8", errors="replace").strip()
    except Exception as e:
        logger.error("txt_parse_error", error=str(e))
        return ""


class ResumeService:
    async def upload_resume(self, db: AsyncSession, user_id: UUID, file: UploadFile) -> Resume:
        # ── Read the file bytes into memory ──────────────────────────────────
        content = await file.read()
        filename = file.filename or ""
        lower = filename.lower()

        # ── Parse text based on file type ─────────────────────────────────────
        if lower.endswith(".pdf"):
            full_text = _extract_text_from_pdf(content)
        elif lower.endswith(".docx"):
            full_text = _extract_text_from_docx(content)
        elif lower.endswith(".txt"):
            full_text = _extract_text_from_txt(content)
        else:
            full_text = ""

        logger.info(
            "resume_parsed",
            filename=filename,
            chars_extracted=len(full_text),
        )

        # ── Persist to DB ─────────────────────────────────────────────────────
        # We store the raw text in parsed_data so downstream services
        # (question_service, evaluation_engine) can inject it into LLM prompts.
        parsed_data = {
            "full_text": full_text,
            "char_count": len(full_text),
        }

        resume = Resume(
            user_id=user_id,
            # We don't upload to cloud storage for now — store a reference URI
            file_url=f"local://resumes/{uuid.uuid4()}_{filename}",
            file_name=filename,
            parsed_data=parsed_data,
        )
        db.add(resume)
        await db.commit()
        await db.refresh(resume)

        return resume


resume_service = ResumeService()
