"""
Improvement Service — AI-powered skill improvement hub.

Reads aggregated analytics from ALL of the user's InterviewReports,
then generates personalised tips and a 3-stage practice roadmap for
each weak skill (Communication, Confidence, Grammar).
"""
import json
import re
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete
from uuid import UUID
from app.models.database.analytics import (
    InterviewReport, SkillTip, SkillExercise
)
from app.ai.llm_engine import llm_engine
from app.utils.logger import logger


# ─── Skill metadata ───────────────────────────────────────────────────────────
SKILL_META = {
    "communication": {
        "label": "Communication",
        "column": InterviewReport.communication_avg,
        "stage_themes": [
            "Clear sentence structure and basic articulation",
            "Organising ideas with the STAR method",
            "Persuasive & confident professional communication",
        ],
    },
    "confidence": {
        "label": "Confidence",
        "column": InterviewReport.confidence_avg,
        "stage_themes": [
            "Overcoming hesitation and filler words",
            "Assertive language and self-advocacy",
            "Projecting authority and executive presence",
        ],
    },
    "grammar": {
        "label": "Grammar & Syntax",
        "column": InterviewReport.grammar_avg,
        "stage_themes": [
            "Sentence structure fundamentals and subject-verb agreement",
            "Tense consistency and punctuation in professional writing",
            "Advanced vocabulary and eliminating common grammar mistakes",
        ],
    },
}

WEAK_THRESHOLD = 60.0   # scores below this trigger tips + roadmap
STRONG_THRESHOLD = 75.0


# ─── Internal helpers ─────────────────────────────────────────────────────────

async def _get_aggregated_scores(db: AsyncSession, user_id: UUID) -> dict[str, float]:
    """Return lifetime average for each skill across all InterviewReports."""
    scores = {}
    for skill, meta in SKILL_META.items():
        result = await db.execute(
            select(func.avg(meta["column"])).where(InterviewReport.user_id == user_id)
        )
        val = result.scalar()
        scores[skill] = round(float(val), 2) if val is not None else 0.0
    return scores


async def _get_score_trends(db: AsyncSession, user_id: UUID) -> dict[str, list[float]]:
    """Return the last 5 report values per skill (for sparklines), oldest → newest."""
    stmt = (
        select(
            InterviewReport.communication_avg,
            InterviewReport.confidence_avg,
            InterviewReport.grammar_avg,
        )
        .where(InterviewReport.user_id == user_id)
        .order_by(InterviewReport.created_at.desc())
        .limit(5)
    )
    result = await db.execute(stmt)
    rows = result.all()
    rows = list(reversed(rows))  # oldest first

    trends: dict[str, list[float]] = {"communication": [], "confidence": [], "grammar": []}
    for row in rows:
        trends["communication"].append(float(row[0]) if row[0] else 0.0)
        trends["confidence"].append(float(row[1]) if row[1] else 0.0)
        trends["grammar"].append(float(row[2]) if row[2] else 0.0)
    return trends


async def _generate_tips_llm(skill: str, avg_score: float) -> list[str]:
    """Call LLM to produce 3 improvement tips for the given skill and average score."""
    meta = SKILL_META[skill]
    prompt = (
        f"A candidate's overall {meta['label']} score across all their mock interviews is {avg_score:.0f}/100. "
        f"This score is considered weak (below 60). "
        f"Generate exactly 3 specific, actionable improvement tips for this candidate. "
        f"Each tip must be 1-2 sentences max, practical, and directly useful for interview performance. "
        f"Return ONLY a JSON array of 3 strings. No preamble, no explanation, no markdown.\n"
        f'Example format: ["Tip one.", "Tip two.", "Tip three."]'
    )
    try:
        raw = await llm_engine.generate_response(
            prompt=prompt,
            system_prompt="You are an expert interview coach. Return only valid JSON arrays.",
            temperature=0.7,
        )
        cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
        tips = json.loads(cleaned)
        if isinstance(tips, list):
            return [str(t) for t in tips[:3]]
    except Exception as e:
        logger.error("tip_generation_failed", skill=skill, error=str(e))
    # Sensible fallback tips
    return [
        f"Review common {meta['label'].lower()} mistakes from your past interview answers.",
        f"Practice {meta['label'].lower()} exercises daily for 5 minutes.",
        f"Record yourself answering questions and review for {meta['label'].lower()} issues.",
    ]


async def _generate_exercises_llm(skill: str, avg_score: float) -> list[dict]:
    """Call LLM to produce 9 exercises (3 per stage) for the given skill."""
    meta = SKILL_META[skill]
    stages_text = "\n".join(
        f"Stage {i+1} — {theme}" for i, theme in enumerate(meta["stage_themes"])
    )
    prompt = (
        f"A candidate needs to improve their {meta['label']} skill (current score: {avg_score:.0f}/100). "
        f"Generate a 3-stage practice roadmap with 3 exercises per stage (9 total).\n\n"
        f"Stages:\n{stages_text}\n\n"
        f"For each exercise provide: stage (1|2|3), order_in_stage (1|2|3), title (short), "
        f"description (2 sentences — what to do and why), difficulty (easy|medium|hard).\n"
        f"Return ONLY a valid JSON array of 9 objects. No markdown.\n"
        f'Example: [{{"stage":1,"order_in_stage":1,"title":"Fix These Sentences","description":"...","difficulty":"easy"}}]'
    )
    try:
        raw = await llm_engine.generate_response(
            prompt=prompt,
            system_prompt="You are an expert interview coach. Return only valid JSON arrays.",
            temperature=0.6,
        )
        cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
        exercises = json.loads(cleaned)
        if isinstance(exercises, list) and len(exercises) >= 1:
            return exercises[:9]
    except Exception as e:
        logger.error("exercise_generation_failed", skill=skill, error=str(e))

    # Fallback: static exercises
    themes = meta["stage_themes"]
    fallback = []
    diff_map = {1: "easy", 2: "medium", 3: "hard"}
    for stage in range(1, 4):
        for order in range(1, 4):
            fallback.append({
                "stage": stage,
                "order_in_stage": order,
                "title": f"{themes[stage-1][:40]} — Exercise {order}",
                "description": (
                    f"Practice exercise {order} focused on {themes[stage-1].lower()}. "
                    f"Spend 5 minutes completing this task carefully."
                ),
                "difficulty": diff_map[stage],
            })
    return fallback


# ─── Public Service ───────────────────────────────────────────────────────────

class ImprovementService:

    async def get_overview(self, db: AsyncSession, user_id: UUID) -> dict:
        """
        Returns everything the frontend needs to render the Growth tab:
        - avg scores per skill (from ALL interviews)
        - score trends (last 5)
        - cached tips per skill
        - exercises per skill (grouped by stage)
        - completed count / total for progress
        """
        avg_scores = await _get_aggregated_scores(db, user_id)
        trends = await _get_score_trends(db, user_id)

        skills_data = {}
        for skill in SKILL_META:
            avg = avg_scores.get(skill, 0.0)

            # Load cached tips
            tips_result = await db.execute(
                select(SkillTip)
                .where(SkillTip.user_id == user_id, SkillTip.skill == skill)
                .order_by(SkillTip.tip_order)
            )
            tips = [
                {"id": str(t.id), "text": t.tip_text, "order": t.tip_order}
                for t in tips_result.scalars().all()
            ]

            # Load exercises grouped by stage
            ex_result = await db.execute(
                select(SkillExercise)
                .where(SkillExercise.user_id == user_id, SkillExercise.skill == skill)
                .order_by(SkillExercise.stage, SkillExercise.order_in_stage)
            )
            exercises = ex_result.scalars().all()
            stages: dict[int, list] = {1: [], 2: [], 3: []}
            for ex in exercises:
                stages[ex.stage].append({
                    "id": str(ex.id),
                    "title": ex.title,
                    "description": ex.description,
                    "difficulty": ex.difficulty,
                    "is_completed": ex.is_completed,
                    "completed_at": ex.completed_at.isoformat() if ex.completed_at else None,
                    "order": ex.order_in_stage,
                })

            total = len(exercises)
            done = sum(1 for ex in exercises if ex.is_completed)

            skills_data[skill] = {
                "label": SKILL_META[skill]["label"],
                "avg_score": avg,
                "trend": trends.get(skill, []),
                "status": "strong" if avg >= STRONG_THRESHOLD else ("improving" if avg >= WEAK_THRESHOLD else "weak"),
                "tips": tips,
                "stages": stages,
                "total_exercises": total,
                "completed_exercises": done,
            }

        # Build progress timeline (all completed exercises, newest first)
        timeline_result = await db.execute(
            select(SkillExercise)
            .where(
                SkillExercise.user_id == user_id,
                SkillExercise.is_completed == True,  # noqa: E712
            )
            .order_by(SkillExercise.completed_at.desc())
            .limit(20)
        )
        timeline = [
            {
                "id": str(ex.id),
                "skill": ex.skill,
                "title": ex.title,
                "completed_at": ex.completed_at.isoformat() if ex.completed_at else None,
            }
            for ex in timeline_result.scalars().all()
        ]

        return {
            "avg_scores": avg_scores,
            "skills": skills_data,
            "timeline": timeline,
        }

    async def generate_for_skill(self, db: AsyncSession, user_id: UUID, skill: str) -> dict:
        """
        (Re-)generate AI tips and exercise roadmap for a specific skill.
        Deletes old data first so the user always gets fresh content.
        """
        if skill not in SKILL_META:
            raise ValueError(f"Unknown skill: {skill}. Must be one of {list(SKILL_META.keys())}")

        avg_scores = await _get_aggregated_scores(db, user_id)
        avg = avg_scores.get(skill, 0.0)

        # ── Wipe old tips & exercises for this skill ──────────────────────────
        await db.execute(
            delete(SkillTip).where(SkillTip.user_id == user_id, SkillTip.skill == skill)
        )
        await db.execute(
            delete(SkillExercise).where(SkillExercise.user_id == user_id, SkillExercise.skill == skill)
        )

        # ── Generate fresh tips ───────────────────────────────────────────────
        tips_text = await _generate_tips_llm(skill, avg)
        for i, tip in enumerate(tips_text, start=1):
            db.add(SkillTip(
                user_id=user_id,
                skill=skill,
                tip_text=tip,
                tip_order=i,
                score_at_generation=avg,
            ))

        # ── Generate exercise roadmap ─────────────────────────────────────────
        exercises_data = await _generate_exercises_llm(skill, avg)
        for ex in exercises_data:
            db.add(SkillExercise(
                user_id=user_id,
                skill=skill,
                stage=int(ex.get("stage", 1)),
                order_in_stage=int(ex.get("order_in_stage", 1)),
                title=str(ex.get("title", "Exercise")),
                description=str(ex.get("description", "")),
                difficulty=str(ex.get("difficulty", "easy")),
            ))

        await db.commit()
        logger.info("skill_improvement_generated", user_id=str(user_id), skill=skill, avg=avg)
        return {"skill": skill, "avg_score": avg, "tips_count": len(tips_text), "exercises_count": len(exercises_data)}

    async def complete_exercise(self, db: AsyncSession, user_id: UUID, exercise_id: UUID) -> dict:
        """Mark an exercise as complete (idempotent)."""
        result = await db.execute(
            select(SkillExercise).where(
                SkillExercise.id == exercise_id,
                SkillExercise.user_id == user_id,
            )
        )
        ex = result.scalars().first()
        if not ex:
            raise ValueError("Exercise not found or does not belong to this user.")
        ex.is_completed = True
        ex.completed_at = datetime.now(timezone.utc)
        await db.commit()
        return {"exercise_id": str(exercise_id), "completed_at": ex.completed_at.isoformat()}

    async def uncomplete_exercise(self, db: AsyncSession, user_id: UUID, exercise_id: UUID) -> dict:
        """Un-check an exercise (toggle off)."""
        result = await db.execute(
            select(SkillExercise).where(
                SkillExercise.id == exercise_id,
                SkillExercise.user_id == user_id,
            )
        )
        ex = result.scalars().first()
        if not ex:
            raise ValueError("Exercise not found or does not belong to this user.")
        ex.is_completed = False
        ex.completed_at = None
        await db.commit()
        return {"exercise_id": str(exercise_id), "completed": False}


improvement_service = ImprovementService()
