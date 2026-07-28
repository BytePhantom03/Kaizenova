"""
Skills Practice Service

Orchestrates the full lifecycle of a skill practice session:
  1. Start session → generate first prompt
  2. Submit response → evaluate → generate next prompt
  3. Complete session → aggregate scores, generate report, update progress

Follows the Repository/Service pattern of the existing codebase.
Never exposes repository exceptions directly — wraps in meaningful errors.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.skills_practice import (
    SESSION_STATUS_COMPLETED, SESSION_STATUS_IN_PROGRESS,
    TRAINER_TYPES,
)
from app.repositories.skills_repository import (
    skill_session_repo, skill_turn_repo, skill_progress_repo, vocabulary_repo,
)
from app.ai.skills_evaluator import skills_evaluator, MAX_TURNS
from app.services.gamification_service import calculate_gamification_rewards
from app.utils.logger import logger

# ── Trainer catalog ─────────────────────────────────────────────────────────

TRAINER_CATALOG = [
    {
        "id": "speaking", "name": "English Speaking Practice",
        "description": "Practice answering interview-style and everyday English questions with real-time AI feedback on grammar, fluency, vocabulary, and confidence.",
        "icon": "🎙️", "category": "Speaking", "phase": 1,
        "skills_measured": ["Grammar", "Fluency", "Vocabulary", "Confidence", "Coherence"],
        "avg_session_minutes": 10,
    },
    {
        "id": "fluency", "name": "Fluency Coach",
        "description": "Speak on a given topic for 2 minutes. AI measures your fluency, filler words, hesitation, and speaking pace to build natural, confident speech.",
        "icon": "💬", "category": "Speaking", "phase": 1,
        "skills_measured": ["Fluency", "Coherence", "Vocabulary", "Confidence"],
        "avg_session_minutes": 8,
    },
    {
        "id": "ielts", "name": "IELTS Speaking Trainer",
        "description": "Full IELTS Speaking test simulation. Parts 1, 2, and 3 with band score, examiner feedback, and model answers.",
        "icon": "🏆", "category": "Certification", "phase": 1,
        "skills_measured": ["Fluency & Coherence", "Lexical Resource", "Grammar Range", "Pronunciation"],
        "avg_session_minutes": 15,
    },
    {
        "id": "vocabulary", "name": "Vocabulary Builder",
        "description": "Learn professional and advanced English vocabulary with AI-generated definitions, examples, and spaced-repetition flashcards.",
        "icon": "📚", "category": "Language", "phase": 1,
        "skills_measured": ["Vocabulary", "Retention"],
        "avg_session_minutes": 5,
    },
    {
        "id": "grammar", "name": "Grammar Trainer",
        "description": "AI-generated grammar exercises with real-time correction, rule explanations, and performance tracking.",
        "icon": "✏️", "category": "Language", "phase": 1,
        "skills_measured": ["Grammar", "Accuracy"],
        "avg_session_minutes": 8,
    },
    {
        "id": "hr", "name": "HR Communication Practice",
        "description": "Practice tell-me-about-yourself, behavioural questions, and salary negotiation with AI feedback.",
        "icon": "🤝", "category": "Professional", "phase": 1,
        "skills_measured": ["Communication", "Confidence", "Clarity"],
        "avg_session_minutes": 12,
    },
    {
        "id": "public", "name": "Public Speaking Coach",
        "description": "Rehearse speeches, presentations, and seminars. AI scores your delivery, structure, energy, and clarity.",
        "icon": "🎤", "category": "Speaking", "phase": 1,
        "skills_measured": ["Confidence", "Clarity", "Organisation"],
        "avg_session_minutes": 10,
    },
    {
        "id": "email", "name": "Email Writing Coach",
        "description": "Write professional emails in response to AI-generated tasks. Get grammar, tone, and formatting feedback.",
        "icon": "📧", "category": "Writing", "phase": 1,
        "skills_measured": ["Grammar", "Tone", "Professionalism"],
        "avg_session_minutes": 10,
    },
    {
        "id": "storytelling", "name": "Storytelling Coach",
        "description": "Tell compelling stories using the STAR/narrative framework. AI analyses structure, emotion, and flow.",
        "icon": "📖", "category": "Speaking", "phase": 1,
        "skills_measured": ["Structure", "Emotion", "Vocabulary"],
        "avg_session_minutes": 12,
    },
    {
        "id": "leadership", "name": "Leadership Communication",
        "description": "Practice giving instructions, feedback, and conflict resolution in leadership scenarios.",
        "icon": "👔", "category": "Professional", "phase": 1,
        "skills_measured": ["Communication", "Authority", "Clarity"],
        "avg_session_minutes": 12,
    },
    {
        "id": "negotiation", "name": "Negotiation Practice",
        "description": "Roleplay salary, vendor, and client negotiations with an AI counterpart that challenges your reasoning.",
        "icon": "🤜", "category": "Professional", "phase": 1,
        "skills_measured": ["Confidence", "Communication", "Logic"],
        "avg_session_minutes": 15,
    },
    {
        "id": "confidence", "name": "Confidence Booster",
        "description": "High-pressure speaking situations with instant assertiveness and composure feedback.",
        "icon": "⚡", "category": "Mindset", "phase": 1,
        "skills_measured": ["Confidence", "Assertiveness", "Composure"],
        "avg_session_minutes": 8,
    },
]


def _compute_avg_scores(evaluations: List[Dict[str, Any]]) -> Dict[str, float]:
    """Average all numeric score fields across evaluations."""
    if not evaluations:
        return {}
    score_keys = ["grammar_score", "fluency_score", "vocabulary_score",
                  "confidence_score", "coherence_score", "composite_score"]
    totals: Dict[str, float] = {k: 0.0 for k in score_keys}
    counts: Dict[str, int] = {k: 0 for k in score_keys}
    for ev in evaluations:
        for k in score_keys:
            if ev.get(k) is not None:
                totals[k] += float(ev[k])
                counts[k] += 1
    return {
        k: round(totals[k] / counts[k], 2)
        for k in score_keys if counts[k] > 0
    }


class SkillsService:

    def get_trainer_catalog(self) -> List[Dict[str, Any]]:
        return TRAINER_CATALOG

    # ── Session lifecycle ──────────────────────────────────────────────────

    async def start_session(
        self,
        db: AsyncSession,
        user_id: UUID,
        trainer_type: str,
        topic: Optional[str],
        sub_mode: Optional[str],
        session_config: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Start a new practice session and return the first AI prompt.
        """
        logger.info("skills_session_start", user_id=str(user_id), trainer=trainer_type)

        # Generate first prompt based on trainer type
        first_prompt = await self._generate_initial_prompt(
            trainer_type, topic, sub_mode, session_config or {}
        )

        session = await skill_session_repo.create(db, {
            "user_id": user_id,
            "trainer_type": trainer_type,
            "topic": topic,
            "sub_mode": sub_mode or self._default_sub_mode(trainer_type),
            "status": SESSION_STATUS_IN_PROGRESS,
            "session_config": session_config or {},
        })

        # Record turn 0 (the first AI prompt — no user response yet)
        await skill_turn_repo.create(db, {
            "session_id": session.id,
            "turn_order": 1,
            "prompt": first_prompt,
            "user_response": None,
            "evaluation": None,
            "scores": None,
        })

        return {
            "session_id": str(session.id),
            "trainer_type": trainer_type,
            "topic": topic,
            "first_prompt": first_prompt,
            "max_turns": MAX_TURNS.get(trainer_type, 5),
            "status": SESSION_STATUS_IN_PROGRESS,
        }

    async def submit_response(
        self,
        db: AsyncSession,
        user_id: UUID,
        session_id: UUID,
        user_response: str,
    ) -> Dict[str, Any]:
        """
        Accept user's response for the current turn, evaluate it,
        and return evaluation + next prompt (or completion signal).
        """
        session = await skill_session_repo.get_user_session(db, session_id, user_id)
        if not session:
            raise ValueError(f"Session {session_id} not found or access denied.")
        if session.status != SESSION_STATUS_IN_PROGRESS:
            raise ValueError("Session is already completed or abandoned.")

        turns = await skill_turn_repo.get_turns_for_session(db, session_id)
        current_turn = next((t for t in turns if t.user_response is None), None)

        if current_turn is None:
            raise ValueError("No pending prompt found for this session.")

        # Evaluate the response
        evaluation = await self._evaluate_response(
            trainer_type=session.trainer_type,
            prompt=current_turn.prompt,
            response=user_response,
            topic=session.topic,
            sub_mode=session.sub_mode,
        )

        scores = {
            "grammar": evaluation.get("grammar_score"),
            "fluency": evaluation.get("fluency_score"),
            "vocabulary": evaluation.get("vocabulary_score"),
            "confidence": evaluation.get("confidence_score"),
            "coherence": evaluation.get("coherence_score"),
            "composite": evaluation.get("composite_score"),
        }

        # Persist user response + evaluation to the turn
        await skill_turn_repo.update(db, current_turn.id, {
            "user_response": user_response,
            "evaluation": evaluation,
            "scores": scores,
        })

        # Determine if session is complete
        answered_turns = len([t for t in turns if t.user_response is not None]) + 1
        max_t = MAX_TURNS.get(session.trainer_type, 5)
        is_complete = answered_turns >= max_t

        next_prompt = None
        if not is_complete:
            next_turn_order = current_turn.turn_order + 1
            next_prompt = await self._generate_followup_prompt(
                session.trainer_type, session.topic,
                session.sub_mode, next_turn_order, evaluation,
            )
            await skill_turn_repo.create(db, {
                "session_id": session_id,
                "turn_order": next_turn_order,
                "prompt": next_prompt,
                "user_response": None,
            })

        logger.info("skills_turn_evaluated", session_id=str(session_id),
                    turn=current_turn.turn_order, score=evaluation.get("composite_score"))

        return {
            "turn_id": str(current_turn.id),
            "evaluation": evaluation,
            "scores": scores,
            "next_prompt": next_prompt,
            "is_session_complete": is_complete,
            "session_id": str(session_id),
            "turns_completed": answered_turns,
            "max_turns": max_t,
        }

    async def complete_session(
        self, db: AsyncSession, user_id: UUID, session_id: UUID
    ) -> Dict[str, Any]:
        """
        Finalize session: compute aggregate scores, generate AI report,
        update skill progress, mark session as completed.
        """
        session = await skill_session_repo.get_user_session(db, session_id, user_id)
        if not session:
            raise ValueError(f"Session {session_id} not found or access denied.")

        turns = await skill_turn_repo.get_turns_for_session(db, session_id)
        evaluations = [t.evaluation for t in turns if t.evaluation]

        avg_scores = _compute_avg_scores(evaluations)
        overall = avg_scores.get("composite_score", 50.0)

        # Generate holistic AI session report
        report = await skills_evaluator.generate_session_report(
            trainer_type=session.trainer_type,
            topic=session.topic,
            turns_data=evaluations,
            avg_scores=avg_scores,
        )

        now = datetime.now(timezone.utc)
        await skill_session_repo.update(db, session_id, {
            "status": SESSION_STATUS_COMPLETED,
            "overall_score": report["overall_score"],
            "completed_at": now,
            "summary": report,
        })

        # Update rolling progress
        await skill_progress_repo.upsert_progress(
            db, user_id, session.trainer_type, report["overall_score"]
        )

        # Update Gamification (XP, Levels, Streaks, Badges)
        rewards = await calculate_gamification_rewards(
            db, str(user_id), session.trainer_type, report["overall_score"]
        )

        logger.info("skills_session_completed", session_id=str(session_id),
                    trainer=session.trainer_type, score=report["overall_score"],
                    rewards=rewards)

        return {
            "session_id": str(session_id),
            "trainer_type": session.trainer_type,
            "topic": session.topic,
            "overall_score": report["overall_score"],
            "dimension_scores": avg_scores,
            "strengths": report["strengths"],
            "weaknesses": report["weaknesses"],
            "ai_feedback": report["ai_feedback"],
            "suggestions": report["suggestions"],
            "improvement_roadmap": report["improvement_roadmap"],
            "turns_count": len(evaluations),
            "gamification": rewards,
        }

    async def get_session(
        self, db: AsyncSession, user_id: UUID, session_id: UUID
    ) -> Optional[Dict[str, Any]]:
        session = await skill_session_repo.get_user_session(db, session_id, user_id)
        if not session:
            return None
        turns = await skill_turn_repo.get_turns_for_session(db, session_id)
        return {"session": session, "turns": turns}

    async def get_history(
        self,
        db: AsyncSession,
        user_id: UUID,
        trainer_type: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List:
        return await skill_session_repo.get_history(db, user_id, trainer_type, limit, offset)

    async def get_all_progress(self, db: AsyncSession, user_id: UUID) -> List:
        return await skill_progress_repo.get_all_for_user(db, user_id)

    # ── Vocabulary service methods ─────────────────────────────────────────

    async def get_vocabulary(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ):
        return await vocabulary_repo.get_all_for_user(db, user_id, limit, offset)

    async def add_vocabulary_word(
        self, db: AsyncSession, user_id: UUID, word: str, difficulty: str
    ):
        """Generate word data via AI, then persist."""
        from datetime import timezone as tz, timedelta
        word_data = await skills_evaluator.generate_vocabulary_word(difficulty)
        # Override with requested word
        word_data["word"] = word
        now = datetime.now(tz.utc)
        return await vocabulary_repo.create(db, {
            "user_id": user_id,
            "word": word_data["word"],
            "definition": word_data["definition"],
            "example_sentence": word_data["example_sentence"],
            "difficulty": difficulty,
            "context_tags": word_data.get("context_tags", []),
            "next_review_at": now + timedelta(hours=1),
            "mastery_level": 0,
            "review_count": 0,
        })

    async def generate_vocabulary_word_ai(
        self, db: AsyncSession, user_id: UUID, difficulty: str
    ):
        """Let AI pick a word and add it for the user."""
        from datetime import timezone as tz, timedelta
        word_data = await skills_evaluator.generate_vocabulary_word(difficulty)
        now = datetime.now(tz.utc)
        return await vocabulary_repo.create(db, {
            "user_id": user_id,
            "word": word_data["word"],
            "definition": word_data["definition"],
            "example_sentence": word_data["example_sentence"],
            "difficulty": difficulty,
            "context_tags": word_data.get("context_tags", []),
            "next_review_at": now + timedelta(hours=1),
            "mastery_level": 0,
            "review_count": 0,
        })

    async def review_vocabulary_word(
        self, db: AsyncSession, user_id: UUID, item_id: UUID, remembered: bool
    ):
        item = await vocabulary_repo.get_by_id(db, item_id)
        if not item or item.user_id != user_id:
            raise ValueError("Vocabulary item not found.")
        return await vocabulary_repo.update_review(db, item_id, remembered)

    async def get_due_for_review(self, db: AsyncSession, user_id: UUID):
        return await vocabulary_repo.get_due_for_review(db, user_id)

    async def evaluate_vocabulary_quiz(
        self, word: str, definition: str, user_answer: str
    ) -> Dict[str, Any]:
        return await skills_evaluator.evaluate_vocabulary_quiz(word, definition, user_answer)

    # ── Grammar exercise helpers ───────────────────────────────────────────

    async def generate_grammar_exercise(
        self, exercise_type: str, difficulty: str
    ) -> Dict[str, str]:
        return await skills_evaluator.generate_grammar_exercise(exercise_type, difficulty)

    # ── Internal helpers ───────────────────────────────────────────────────

    async def _generate_initial_prompt(
        self, trainer_type: str, topic: Optional[str],
        sub_mode: Optional[str], config: Dict[str, Any]
    ) -> str:
        if trainer_type == "speaking":
            return await skills_evaluator.generate_next_speaking_prompt(1)
        if trainer_type == "fluency":
            difficulty = config.get("difficulty", "intermediate")
            t = topic or await skills_evaluator.generate_fluency_topic(difficulty)
            return (
                f"Topic: **{t}**\n\n"
                "Please speak about this topic for 1–2 minutes. "
                "Talk as naturally as possible — imagine explaining it to a friend."
            )
        if trainer_type == "ielts":
            part = sub_mode or "part1"
            return await skills_evaluator.generate_ielts_prompt(part, topic)
        if trainer_type == "grammar":
            exercise_type = config.get("exercise_type", "error_correction")
            difficulty = config.get("difficulty", "intermediate")
            ex = await skills_evaluator.generate_grammar_exercise(exercise_type, difficulty)
            return f"{ex['prompt']}\n\n💡 Hint: {ex['hint']}" if ex.get("hint") else ex["prompt"]
        if trainer_type == "vocabulary":
            difficulty = config.get("difficulty", "intermediate")
            word_data = await skills_evaluator.generate_vocabulary_word(difficulty)
            return (
                f"**Word:** {word_data['word']}\n"
                f"**Definition:** {word_data['definition']}\n\n"
                f"Please use this word in an original sentence that demonstrates its meaning."
            )
        if trainer_type == "hr":
            return await skills_evaluator.generate_hr_prompt(1)
        if trainer_type == "public":
            return await skills_evaluator.generate_public_speaking_prompt(1)
        if trainer_type == "email":
            task = await skills_evaluator.generate_email_task(1)
            return f"📧 **Email Task:**\n\n{task}\n\nWrite a complete professional email below."
        if trainer_type == "storytelling":
            return await skills_evaluator.generate_storytelling_prompt(1)
        if trainer_type == "leadership":
            return await skills_evaluator.generate_leadership_prompt(1)
        if trainer_type == "negotiation":
            role = config.get("role", "hr")
            return await skills_evaluator.generate_negotiation_prompt(1, role)
        if trainer_type == "confidence":
            return await skills_evaluator.generate_confidence_prompt(1)
        return "Please share your thoughts on today's topic."

    async def _generate_followup_prompt(
        self, trainer_type: str, topic: Optional[str],
        sub_mode: Optional[str], turn_order: int, prev_eval: Dict[str, Any],
    ) -> str:
        if trainer_type == "speaking":
            return await skills_evaluator.generate_next_speaking_prompt(turn_order)
        if trainer_type == "ielts":
            # Cycle through parts
            parts = ["part1", "part2", "part3"]
            part = parts[(turn_order - 1) % len(parts)]
            return await skills_evaluator.generate_ielts_prompt(part, topic)
        if trainer_type == "grammar":
            ex = await skills_evaluator.generate_grammar_exercise("error_correction", "intermediate")
            return ex["prompt"]
        if trainer_type == "vocabulary":
            word_data = await skills_evaluator.generate_vocabulary_word("intermediate")
            return (
                f"**Word:** {word_data['word']}\n"
                f"**Definition:** {word_data['definition']}\n\n"
                f"Please use this word in a sentence."
            )
        if trainer_type == "hr":
            return await skills_evaluator.generate_hr_prompt(turn_order)
        if trainer_type == "public":
            return await skills_evaluator.generate_public_speaking_prompt(turn_order)
        if trainer_type == "email":
            task = await skills_evaluator.generate_email_task(turn_order)
            return f"📧 **Email Task:**\n\n{task}\n\nWrite a complete professional email below."
        if trainer_type == "storytelling":
            return await skills_evaluator.generate_storytelling_prompt(turn_order)
        if trainer_type == "leadership":
            return await skills_evaluator.generate_leadership_prompt(turn_order)
        if trainer_type == "negotiation":
            return await skills_evaluator.generate_negotiation_prompt(turn_order)
        if trainer_type == "confidence":
            return await skills_evaluator.generate_confidence_prompt(turn_order)
        return "Please continue with your response."

    def _default_sub_mode(self, trainer_type: str) -> Optional[str]:
        defaults = {"ielts": "part1"}
        return defaults.get(trainer_type)

    async def _evaluate_response(
        self, trainer_type: str, prompt: str, response: str,
        topic: Optional[str], sub_mode: Optional[str],
    ) -> Dict[str, Any]:
        if trainer_type == "speaking":
            return await skills_evaluator.evaluate_speaking_turn(prompt, response)
        if trainer_type == "fluency":
            return await skills_evaluator.evaluate_fluency_turn(topic or "General", response)
        if trainer_type == "ielts":
            return await skills_evaluator.evaluate_ielts_turn(sub_mode or "part1", prompt, response)
        if trainer_type == "grammar":
            return await skills_evaluator.evaluate_grammar_exercise("error_correction", prompt, response)
        if trainer_type == "vocabulary":
            # Extract word from prompt (first line after "Word:")
            word = "vocabulary"
            definition = ""
            for line in prompt.splitlines():
                if line.startswith("**Word:**"):
                    word = line.replace("**Word:**", "").strip()
                if line.startswith("**Definition:**"):
                    definition = line.replace("**Definition:**", "").strip()
            return await skills_evaluator.evaluate_vocabulary_quiz(word, definition, response)
        if trainer_type == "hr":
            return await skills_evaluator.evaluate_hr_turn(prompt, response)
        if trainer_type == "public":
            return await skills_evaluator.evaluate_public_speaking_turn(prompt, response)
        if trainer_type == "email":
            return await skills_evaluator.evaluate_email_turn(prompt, response)
        if trainer_type == "storytelling":
            return await skills_evaluator.evaluate_storytelling_turn(prompt, response)
        if trainer_type == "leadership":
            return await skills_evaluator.evaluate_leadership_turn(prompt, response)
        if trainer_type == "negotiation":
            return await skills_evaluator.evaluate_negotiation_turn(prompt, response)
        if trainer_type == "confidence":
            return await skills_evaluator.evaluate_confidence_turn(prompt, response)
        return await skills_evaluator.evaluate_speaking_turn(prompt, response)


skills_service = SkillsService()
