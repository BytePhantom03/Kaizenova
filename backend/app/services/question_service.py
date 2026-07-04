"""
Question Service — AI-driven question generation.

Primary path: Use Groq LLM to generate a fresh, context-aware question
every time based on interview_type, domain, difficulty, target_role, and
the list of already-asked questions to guarantee no repetition.

Fallback path: If LLM fails, pull a random un-asked question from the DB.
If the DB is also exhausted, generate one anyway (ignoring asked list).
"""
import random
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.database.question import Question
from app.ai.llm_engine import llm_engine
from app.utils.logger import logger
from typing import Optional


# ─── Difficulty label helpers ─────────────────────────────────────────────────
def _difficulty_label(level: int) -> str:
    if level <= 3:
        return "easy / entry-level"
    if level <= 6:
        return "medium / mid-level"
    return "hard / senior-level"


# ─── Interview-type specific prompts ─────────────────────────────────────────
TYPE_INSTRUCTIONS = {
    "technical": (
        "Generate a TECHNICAL interview question. "
        "Focus on: data structures, algorithms, time/space complexity, coding patterns, "
        "system internals, language-specific concepts, debugging, or best practices. "
        "Do NOT ask behavioural, situational, or 'tell me about yourself' questions."
    ),
    "behavioral": (
        "Generate a BEHAVIOURAL interview question using the STAR format. "
        "Focus on: teamwork, conflict resolution, handling failure, leadership, "
        "time management, or growth mindset. "
        "The question should start with phrases like 'Tell me about a time...', "
        "'Describe a situation where...', or 'How did you handle...'. "
        "Do NOT generate technical coding or system design questions."
    ),
    "system_design": (
        "Generate a SYSTEM DESIGN interview question. "
        "Focus on: designing large-scale distributed systems, API design, database schema, "
        "microservices, caching, load balancing, scalability, fault tolerance, or trade-offs. "
        "The question should ask the candidate to 'Design a system for X' or 'How would you architect Y?'. "
        "Do NOT generate coding or behavioural questions."
    ),
}


class QuestionService:

    async def get_next_question(
        self,
        db: AsyncSession,
        domain: str,
        difficulty: int,
        exclude_ids: list[str] = None,
        interview_type: str = "technical",
        target_role: str = "",
        asked_question_texts: list[str] = None,
        resume_context: str = "",
    ) -> Optional[Question]:
        """
        Generate a fresh question via LLM. Falls back to DB if generation fails.
        resume_context: optional full text extracted from the candidate's resume.
        """
        exclude_ids = exclude_ids or []
        asked_texts = asked_question_texts or []

        # ── 1. LLM Generation (primary path) ─────────────────────────────────
        generated = await self._generate_ai_question(
            domain=domain,
            difficulty=difficulty,
            interview_type=interview_type,
            target_role=target_role,
            asked_question_texts=asked_texts,
            resume_context=resume_context,
        )
        if generated:
            return generated

        # ── 2. DB fallback — random un-asked question ─────────────────────────
        logger.warning("ai_question_generation_failed", fallback="db")
        q = await self._db_fallback(db, domain, difficulty, exclude_ids)
        if q:
            return q

        # ── 3. Total fallback — any question ──────────────────────────────────
        stmt = (
            select(Question)
            .filter(Question.is_active.is_(True))
            .order_by(func.random())
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def _generate_ai_question(
        self,
        domain: str,
        difficulty: int,
        interview_type: str,
        target_role: str,
        asked_question_texts: list[str],
        resume_context: str = "",
    ) -> Optional[Question]:
        """Use the LLM to generate a brand-new question. Returns a synthetic Question object."""
        type_instruction = TYPE_INSTRUCTIONS.get(
            interview_type, TYPE_INSTRUCTIONS["technical"]
        )
        diff_label = _difficulty_label(difficulty)

        avoid_section = ""
        if asked_question_texts:
            previews = [f"- {t[:80]}" for t in asked_question_texts[-8:]]  # last 8
            avoid_section = (
                "\n\nAVOID repeating these already-asked questions:\n"
                + "\n".join(previews)
            )

        role_context = f" for a {target_role} role" if target_role else ""

        # ── Resume context injection ──────────────────────────────────────────
        resume_section = ""
        if resume_context and len(resume_context.strip()) > 50:
            # Truncate to keep the prompt within token limits (~2000 chars of resume)
            trimmed = resume_context.strip()[:2000]
            resume_section = (
                f"\n\nCANDIDATE RESUME (use this to personalise your question):\n"
                f"--- BEGIN RESUME ---\n{trimmed}\n--- END RESUME ---\n"
                f"Formulate a question that specifically references the candidate's "
                f"listed projects, technologies, or experiences where relevant."
            )

        prompt = (
            f"{type_instruction}\n\n"
            f"Domain: {domain}\n"
            f"Difficulty: {diff_label} (level {difficulty}/10)\n"
            f"Role context: {target_role or 'Software Engineer'}\n"
            f"{resume_section}"
            f"{avoid_section}\n\n"
            f"Generate ONE concise, clear interview question{role_context}. "
            f"Return ONLY the question text — no preamble, no numbering, no explanation, no quotation marks."
        )

        system_prompt = (
            "You are an expert technical interviewer conducting a personalised interview. "
            "When a candidate resume is provided, always tailor questions to their specific "
            "projects, tech stack, and experience. "
            "You generate precise, realistic interview questions tailored to the given type, domain, and difficulty. "
            "You always return only the question itself with no surrounding text."
        )

        try:
            question_text = await llm_engine.generate_response(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.9,   # high temperature → more variety
            )
            question_text = question_text.strip().strip('"').strip("'").strip()

            if not question_text or "Mock response" in question_text or len(question_text) < 10:
                return None

            # Create a synthetic in-memory Question object (not persisted to DB)
            q = Question()
            q.id = uuid.uuid4()
            q.question_text = question_text
            q.domain = domain
            q.difficulty = difficulty
            q.question_type = interview_type
            q.is_active = True
            q.usage_count = 0
            q.key_concepts = []
            q.hints = {}
            q.company_tags = []
            q.expected_answer = None

            logger.info(
                "ai_question_generated",
                type=interview_type,
                domain=domain,
                difficulty=difficulty,
                preview=question_text[:60],
            )
            return q

        except Exception as e:
            logger.error("ai_question_generation_error", error=str(e))
            return None

    async def _db_fallback(
        self,
        db: AsyncSession,
        domain: str,
        difficulty: int,
        exclude_ids: list[str],
    ) -> Optional[Question]:
        """Pull a random un-asked question from the DB."""
        from uuid import UUID as _UUID
        exclude_uuids = []
        for eid in exclude_ids:
            try:
                exclude_uuids.append(_UUID(str(eid)))
            except (ValueError, AttributeError):
                pass

        # Exact domain + difficulty
        stmt = (
            select(Question)
            .filter(
                Question.domain == domain,
                Question.difficulty == difficulty,
                Question.is_active.is_(True),
                Question.id.notin_(exclude_uuids),
            )
            .order_by(func.random())
            .limit(1)
        )
        result = await db.execute(stmt)
        q = result.scalars().first()
        if q:
            return q

        # Same domain, any difficulty
        stmt2 = (
            select(Question)
            .filter(
                Question.domain == domain,
                Question.is_active.is_(True),
                Question.id.notin_(exclude_uuids),
            )
            .order_by(func.random())
            .limit(1)
        )
        result2 = await db.execute(stmt2)
        return result2.scalars().first()


question_service = QuestionService()
