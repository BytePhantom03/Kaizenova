"""
Resume Service — In-memory resume parsing (PDF + DOCX) + AI experience detection.

After parsing text, uses the Groq LLM to analyse the candidate's experience level
and suggest a difficulty setting for their interview.
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


async def _detect_experience_level(full_text: str) -> dict:
    """
    Use the LLM to analyse the resume text and return:
      - experience_level: 'beginner' | 'intermediate' | 'advanced'
      - experience_years: estimated total years
      - detected_role: primary role (e.g. 'Full Stack Developer')
      - key_skills: top 6 skills from the resume
      - difficulty_setting: 'beginner' | 'intermediate' | 'advanced'

    Falls back to sensible defaults if the LLM fails.
    """
    defaults = {
        "experience_level": "intermediate",
        "experience_years": 0,
        "detected_role": "",
        "key_skills": [],
        "difficulty_setting": "intermediate",
    }

    if not full_text or len(full_text.strip()) < 100:
        return defaults

    from app.ai.llm_engine import llm_engine

    snippet = full_text.strip()[:3000]  # keep within token limits
    prompt = (
        f"Analyse this resume and respond with ONLY a valid JSON object (no markdown, no explanation).\n\n"
        f"Resume:\n{snippet}\n\n"
        f"Respond with this exact JSON structure:\n"
        f'{{"experience_years": <integer>, "experience_level": "<beginner|intermediate|advanced>", '
        f'"detected_role": "<primary job title>", "key_skills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6"], '
        f'"difficulty_setting": "<beginner|intermediate|advanced>"}}\n\n'
        f"Rules for difficulty_setting:\n"
        f"- beginner: 0-1 years experience or student\n"
        f"- intermediate: 2-4 years experience\n"
        f"- advanced: 5+ years experience\n"
        f"Return ONLY the JSON object. No extra text."
    )

    try:
        raw = await llm_engine.generate_response(
            prompt=prompt,
            system_prompt="You are a resume analyser. Always return valid JSON and nothing else.",
            temperature=0.1,
        )
        import json, re
        # Strip any markdown code fences
        cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
        data = json.loads(cleaned)
        # Validate and sanitise
        valid_levels = {"beginner", "intermediate", "advanced"}
        return {
            "experience_years": int(data.get("experience_years", 0)),
            "experience_level": data.get("experience_level", "intermediate") if data.get("experience_level") in valid_levels else "intermediate",
            "detected_role": str(data.get("detected_role", "")),
            "key_skills": [str(s) for s in data.get("key_skills", [])[:10]],
            "difficulty_setting": data.get("difficulty_setting", "intermediate") if data.get("difficulty_setting") in valid_levels else "intermediate",
        }
    except Exception as e:
        logger.error("resume_experience_detection_failed", error=str(e))
        return defaults


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

        # ── AI: detect experience level and difficulty ────────────────────────
        experience_data = await _detect_experience_level(full_text)
        logger.info("resume_experience_detected", **experience_data)

        # ── Persist to DB ─────────────────────────────────────────────────────
        parsed_data = {
            "full_text": full_text,
            "char_count": len(full_text),
            **experience_data,
        }

        resume = Resume(
            user_id=user_id,
            file_url=f"local://resumes/{uuid.uuid4()}_{filename}",
            file_name=filename,
            parsed_data=parsed_data,
        )
        db.add(resume)
        await db.commit()
        await db.refresh(resume)

        return resume


resume_service = ResumeService()
