"""
Skills Evaluator — AI evaluation engine for all personal skill trainers.

Reuses existing llm_engine and grammar_engine.
Each trainer has a dedicated evaluation method with a structured prompt
that always returns a validated JSON payload.

Design principles:
- Never raises — always returns a partial result on failure
- All prompts enforce JSON output via the llm_engine.generate_json()
- Grammar scoring reuses the existing grammar_engine (no duplication)
- Confidence estimated via text-based heuristic (_text_confidence_score)
"""
import json
import re
from typing import Dict, Any, Optional

from app.ai.llm_engine import llm_engine
from app.ai.grammar_engine import grammar_engine
from app.utils.logger import logger


def _text_confidence_score(text: str) -> float:
    """
    Estimate confidence from written text alone (no audio).

    Signals used:
    - Length: longer responses suggest more confidence and depth
    - Filler words: 'um', 'uh', 'like', 'you know' reduce score
    - Hedging phrases: 'I think maybe', 'I'm not sure' reduce score
    - Assertive phrases: 'I believe', 'I am confident' boost score
    - Vocabulary richness: unique_words / total_words ratio
    - Sentence completeness: sentences should end with punctuation
    """
    if not text or len(text.strip()) < 10:
        return 40.0

    words = text.lower().split()
    total_words = len(words)

    # ── Filler word penalty ────────────────────────────────────────────────
    filler_words = {"um", "uh", "hmm", "like", "basically", "literally",
                    "actually", "you know", "i mean", "sort of", "kind of"}
    filler_count = sum(1 for w in words if w in filler_words)
    filler_penalty = min(20, (filler_count / max(total_words, 1)) * 100 * 2)

    # ── Hedging phrase penalty ─────────────────────────────────────────────
    hedges = ["i'm not sure", "i think maybe", "not really", "i suppose",
              "i guess", "perhaps maybe", "i don't know", "might be"]
    hedge_penalty = sum(5 for h in hedges if h in text.lower())

    # ── Assertive phrase bonus ─────────────────────────────────────────────
    assertive = ["i believe", "i am confident", "i know that", "definitely",
                 "absolutely", "certainly", "i am sure", "without doubt",
                 "my experience", "i have", "i achieved", "i successfully"]
    assertive_bonus = min(15, sum(3 for a in assertive if a in text.lower()))

    # ── Length score ───────────────────────────────────────────────────────
    # 30–200 words is ideal for most responses
    if total_words < 10:
        length_score = 40.0
    elif total_words < 30:
        length_score = 55.0
    elif total_words <= 200:
        length_score = 75.0
    else:
        length_score = 70.0   # very long can mean rambling

    # ── Vocabulary richness ────────────────────────────────────────────────
    unique_ratio = len(set(words)) / max(total_words, 1)
    vocab_bonus = min(10, unique_ratio * 15)

    score = length_score + assertive_bonus + vocab_bonus - filler_penalty - hedge_penalty
    return max(20.0, min(100.0, round(score, 1)))


# ── Default fallback result when LLM is unavailable ────────────────────────
_FALLBACK_EVAL: Dict[str, Any] = {
    "grammar_score": 50.0,
    "fluency_score": 50.0,
    "vocabulary_score": 50.0,
    "confidence_score": 50.0,
    "coherence_score": 50.0,
    "composite_score": 50.0,
    "mistakes": [],
    "suggestions": ["Complete the session for a full AI evaluation."],
    "ai_feedback": "AI evaluation is temporarily unavailable. Your response has been recorded.",
    "corrected_version": None,
}

MAX_TURNS = {
    "speaking": 5,
    "fluency": 1,       # single long topic prompt
    "ielts": 6,         # part1=3, part2=1, part3=2
    "grammar": 5,
    "vocabulary": 10,
    "hr": 5,            # behavioural + HR questions
    "public": 3,        # speech rehearsal turns
    "email": 3,         # email writing tasks
    "storytelling": 3,  # story prompts
    "leadership": 4,    # leadership scenarios
    "negotiation": 4,   # negotiation rounds
    "confidence": 4,    # random pressure situations
    "pronunciation": 5, # pronunciation exercises (Phase 2)
}


def _safe_score(val: Any, default: float = 50.0) -> float:
    """Clamp a value to [0, 100], returning default on failure."""
    try:
        return max(0.0, min(100.0, float(val)))
    except (TypeError, ValueError):
        return default


def _extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON from LLM response that may contain markdown fences."""
    # Strip markdown code fences if present
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        text = match.group(1)
    return json.loads(text.strip())


class SkillsEvaluator:
    """
    Unified evaluator for all personal skill trainers.
    Each public method corresponds to one trainer type.
    """

    # ── Speaking Practice ──────────────────────────────────────────────────

    async def evaluate_speaking_turn(
        self, prompt: str, response: str
    ) -> Dict[str, Any]:
        """
        Evaluate one speaking practice turn.
        Reuses grammar_engine for grammar sub-scores,
        and uses LLM for holistic fluency / vocabulary / feedback.
        """
        grammar_score, grammar_issues = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)

        system_prompt = (
            "You are an expert English communication coach. "
            "Evaluate the candidate's spoken English response and return ONLY a JSON object."
        )
        user_prompt = f"""
Question asked: {prompt}

Candidate response: {response}

Grammar score (pre-computed): {grammar_score:.1f}/100
Confidence score (pre-computed): {conf_score:.1f}/100

Return ONLY this JSON (no markdown, no prose):
{{
  "fluency_score": <0-100 float>,
  "vocabulary_score": <0-100 float>,
  "coherence_score": <0-100 float>,
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence holistic feedback>",
  "corrected_version": "<improved version of the response or null>"
}}
"""
        try:
            raw = await llm_engine.generate_response(
                prompt=user_prompt, system_prompt=system_prompt
            )
            data = _extract_json(raw)
            fluency = _safe_score(data.get("fluency_score"))
            vocab = _safe_score(data.get("vocabulary_score"))
            coherence = _safe_score(data.get("coherence_score"))
            composite = round(
                (grammar_score * 0.25) + (fluency * 0.25) + (vocab * 0.2)
                + (conf_score * 0.15) + (coherence * 0.15), 2
            )
            return {
                "grammar_score": grammar_score,
                "fluency_score": fluency,
                "vocabulary_score": vocab,
                "confidence_score": conf_score,
                "coherence_score": coherence,
                "composite_score": composite,
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "corrected_version": data.get("corrected_version"),
                "grammar_issues": [i.get("message") for i in grammar_issues[:3]],
            }
        except Exception as exc:
            logger.warning("speaking_eval_failed", error=str(exc))
            result = dict(_FALLBACK_EVAL)
            result["grammar_score"] = grammar_score
            result["confidence_score"] = conf_score
            return result

    # ── Fluency Coach ──────────────────────────────────────────────────────

    async def evaluate_fluency_turn(
        self, topic: str, response: str
    ) -> Dict[str, Any]:
        """
        Evaluate a free-form monologue for fluency metrics.
        Focus: hesitation, repetition, pace, filler words.
        """
        words = response.strip().split()
        word_count = len(words)
        filler_words = {"um", "uh", "like", "basically", "you know", "sort of", "kind of", "literally"}
        filler_count = sum(1 for w in words if w.lower().rstrip(".,!?") in filler_words)
        grammar_score, _ = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)

        system_prompt = (
            "You are a fluency and public speaking coach. "
            "Evaluate the following monologue response and return ONLY a JSON object."
        )
        user_prompt = f"""
Topic: {topic}

Response ({word_count} words, {filler_count} filler words detected): {response}

Return ONLY this JSON:
{{
  "fluency_score": <0-100>,
  "vocabulary_score": <0-100>,
  "coherence_score": <0-100>,
  "pace_assessment": "<too slow | appropriate | too fast>",
  "hesitation_count": <integer estimate>,
  "repeated_words": [<word>, ...],
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence feedback>",
  "improved_version": "<rewritten fluent version>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            fluency = _safe_score(data.get("fluency_score"))
            vocab = _safe_score(data.get("vocabulary_score"))
            coherence = _safe_score(data.get("coherence_score"))
            composite = round(
                (fluency * 0.35) + (grammar_score * 0.20) + (vocab * 0.20)
                + (conf_score * 0.10) + (coherence * 0.15), 2
            )
            return {
                "grammar_score": grammar_score,
                "fluency_score": fluency,
                "vocabulary_score": vocab,
                "confidence_score": conf_score,
                "coherence_score": coherence,
                "composite_score": composite,
                "filler_count": filler_count,
                "word_count": word_count,
                "pace_assessment": data.get("pace_assessment", "appropriate"),
                "hesitation_count": data.get("hesitation_count", 0),
                "repeated_words": data.get("repeated_words", []),
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "improved_version": data.get("improved_version"),
            }
        except Exception as exc:
            logger.warning("fluency_eval_failed", error=str(exc))
            result = dict(_FALLBACK_EVAL)
            result.update({"grammar_score": grammar_score, "confidence_score": conf_score,
                           "filler_count": filler_count, "word_count": word_count})
            return result

    # ── IELTS Speaking Trainer ─────────────────────────────────────────────

    async def evaluate_ielts_turn(
        self, part: str, prompt: str, response: str
    ) -> Dict[str, Any]:
        """
        Evaluate one IELTS Speaking turn.
        Returns band score (0–9) plus all IELTS-specific criteria.
        """
        grammar_score, _ = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)

        system_prompt = (
            "You are a certified IELTS examiner. "
            "Evaluate the following speaking response strictly using IELTS band descriptors "
            "and return ONLY a JSON object."
        )
        user_prompt = f"""
IELTS Part: {part}
Question/Cue: {prompt}
Candidate response: {response}

Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "band_score": <0.0-9.0 float, 0.5 increments>,
  "fluency_coherence_band": <0.0-9.0>,
  "lexical_resource_band": <0.0-9.0>,
  "grammatical_range_band": <0.0-9.0>,
  "pronunciation_band": <0.0-9.0>,
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<IELTS examiner-style feedback, 2-3 sentences>",
  "model_answer": "<A band 8-9 model answer for this question>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            band = _safe_score(data.get("band_score", 5.0) * (100 / 9), 55.0)
            fc_band = _safe_score(data.get("fluency_coherence_band", 5.0) * (100 / 9))
            lr_band = _safe_score(data.get("lexical_resource_band", 5.0) * (100 / 9))
            gr_band = _safe_score(data.get("grammatical_range_band", 5.0) * (100 / 9))
            pr_band = _safe_score(data.get("pronunciation_band", 5.0) * (100 / 9))
            composite = round((fc_band + lr_band + gr_band + pr_band) / 4, 2)
            return {
                "grammar_score": grammar_score,
                "fluency_score": fc_band,
                "vocabulary_score": lr_band,
                "confidence_score": conf_score,
                "coherence_score": fc_band,
                "pronunciation_score": pr_band,
                "composite_score": composite,
                "band_score": data.get("band_score", 5.0),
                "band_breakdown": {
                    "fluency_coherence": data.get("fluency_coherence_band"),
                    "lexical_resource": data.get("lexical_resource_band"),
                    "grammatical_range": data.get("grammatical_range_band"),
                    "pronunciation": data.get("pronunciation_band"),
                },
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "model_answer": data.get("model_answer"),
            }
        except Exception as exc:
            logger.warning("ielts_eval_failed", error=str(exc))
            result = dict(_FALLBACK_EVAL)
            result.update({"band_score": 5.0, "grammar_score": grammar_score,
                           "confidence_score": conf_score})
            return result

    # ── Grammar Trainer ────────────────────────────────────────────────────

    async def evaluate_grammar_exercise(
        self, exercise_type: str, prompt: str, user_response: str
    ) -> Dict[str, Any]:
        """
        Evaluate a grammar exercise response.
        exercise_type: 'error_correction' | 'sentence_rewrite' | 'fill_blank'
        """
        grammar_score, grammar_issues = await grammar_engine.check_grammar(user_response)

        system_prompt = (
            "You are an expert English grammar teacher. "
            "Evaluate the student's response to a grammar exercise and return ONLY a JSON object."
        )
        user_prompt = f"""
Exercise type: {exercise_type}
Exercise prompt: {prompt}
Student response: {user_response}
Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "is_correct": <true | false>,
  "accuracy_score": <0-100>,
  "errors": [{{ "original": "<text>", "correction": "<text>", "rule": "<grammar rule>" }}, ...],
  "corrected_version": "<correct version of the student's response>",
  "explanation": "<explain the grammar rules involved, 2-3 sentences>",
  "ai_feedback": "<encouraging, constructive teacher feedback>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            accuracy = _safe_score(data.get("accuracy_score", grammar_score))
            composite = round((grammar_score * 0.5) + (accuracy * 0.5), 2)
            return {
                "grammar_score": grammar_score,
                "composite_score": composite,
                "is_correct": data.get("is_correct", False),
                "accuracy_score": accuracy,
                "errors": data.get("errors", []),
                "corrected_version": data.get("corrected_version"),
                "explanation": data.get("explanation", ""),
                "ai_feedback": data.get("ai_feedback", ""),
                "grammar_issues": [i.get("message") for i in grammar_issues[:3]],
            }
        except Exception as exc:
            logger.warning("grammar_eval_failed", error=str(exc))
            return {**_FALLBACK_EVAL, "grammar_score": grammar_score, "errors": [],
                    "is_correct": False, "corrected_version": None}

    # ── Vocabulary Quiz ────────────────────────────────────────────────────

    async def evaluate_vocabulary_quiz(
        self, word: str, definition: str, user_answer: str
    ) -> Dict[str, Any]:
        """
        Evaluate whether the user correctly used or defined a vocabulary word.
        """
        system_prompt = (
            "You are a vocabulary teacher. "
            "Evaluate whether the student correctly answered a vocabulary question "
            "and return ONLY a JSON object."
        )
        user_prompt = f"""
Word: {word}
Correct definition: {definition}
Student answer: {user_answer}

Return ONLY this JSON:
{{
  "is_correct": <true | false>,
  "accuracy_score": <0-100>,
  "feedback": "<brief, encouraging feedback>",
  "example_sentences": ["<sentence 1 using the word>", "<sentence 2>"]
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "is_correct": data.get("is_correct", False),
                "accuracy_score": _safe_score(data.get("accuracy_score", 0)),
                "feedback": data.get("feedback", ""),
                "example_sentences": data.get("example_sentences", []),
            }
        except Exception as exc:
            logger.warning("vocab_eval_failed", error=str(exc))
            return {"is_correct": False, "accuracy_score": 0,
                    "feedback": "Evaluation unavailable.", "example_sentences": []}

    # ── Session report ─────────────────────────────────────────────────────

    async def generate_session_report(
        self,
        trainer_type: str,
        topic: Optional[str],
        turns_data: list,
        avg_scores: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Generate a holistic post-session report from all turns.
        Returns strengths, weaknesses, roadmap, and overall AI feedback.
        """
        system_prompt = (
            "You are an expert personal development coach. "
            "Based on a user's complete practice session, generate a comprehensive "
            "coaching report and return ONLY a JSON object."
        )
        turns_summary = "\n".join(
            f"Turn {i+1}: score={t.get('composite_score', 0):.1f}, "
            f"feedback={t.get('ai_feedback', '')[:100]}"
            for i, t in enumerate(turns_data)
        )
        user_prompt = f"""
Trainer: {trainer_type}
Topic: {topic or 'General'}

Session turns summary:
{turns_summary}

Average scores: {avg_scores}

Return ONLY this JSON:
{{
  "overall_score": <0-100 float>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "ai_feedback": "<comprehensive coaching summary, 3-4 sentences>",
  "suggestions": [<3-5 specific actionable suggestions>],
  "improvement_roadmap": [<3-step roadmap items>]
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "overall_score": _safe_score(data.get("overall_score",
                                              avg_scores.get("composite_score", 50.0))),
                "strengths": data.get("strengths", []),
                "weaknesses": data.get("weaknesses", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "suggestions": data.get("suggestions", []),
                "improvement_roadmap": data.get("improvement_roadmap", []),
            }
        except Exception as exc:
            logger.warning("session_report_failed", error=str(exc))
            return {
                "overall_score": avg_scores.get("composite_score", 50.0),
                "strengths": [], "weaknesses": [],
                "ai_feedback": "Report generation unavailable.",
                "suggestions": [], "improvement_roadmap": [],
            }

    # ── Prompt generators ──────────────────────────────────────────────────

    async def generate_next_speaking_prompt(self, turn_number: int, domain: str = "general") -> str:
        """Generate the next AI interviewer question for speaking practice."""
        questions = {
            "general": [
                "Tell me about yourself and what you do for a living.",
                "Describe a challenge you faced recently and how you overcame it.",
                "What are your greatest strengths and how do they help you at work?",
                "Where do you see yourself in five years?",
                "Tell me about a time you had to work under pressure.",
            ],
            "professional": [
                "How do you prioritize your tasks when you have multiple deadlines?",
                "Describe your leadership style with a specific example.",
                "Tell me about a project where you had to collaborate with a difficult team member.",
                "How do you stay updated with industry trends?",
                "What motivates you most in your professional life?",
            ],
        }
        bank = questions.get(domain, questions["general"])
        return bank[(turn_number - 1) % len(bank)]

    async def generate_fluency_topic(self, difficulty: str = "intermediate") -> str:
        """Return a random fluency topic for the user to speak about."""
        topics = {
            "beginner": [
                "Describe your daily morning routine.",
                "Talk about your favorite food and why you love it.",
                "Describe the city or town where you grew up.",
            ],
            "intermediate": [
                "Explain the impact of social media on modern communication.",
                "Describe a memorable trip or journey you have taken.",
                "Talk about a person who has greatly influenced your life.",
            ],
            "advanced": [
                "Discuss the role of artificial intelligence in the future of work.",
                "Explain how climate change is affecting global economies.",
                "Argue for or against remote work becoming the new standard.",
            ],
        }
        import random
        bank = topics.get(difficulty, topics["intermediate"])
        return random.choice(bank)

    async def generate_ielts_prompt(self, part: str, topic: Optional[str] = None) -> str:
        """Return an IELTS speaking prompt for the given part."""
        prompts = {
            "part1": [
                "Let's talk about your home. Do you live in a house or an apartment? Why?",
                "Do you enjoy reading? What kinds of books do you prefer?",
                "Tell me about the area where you currently live.",
            ],
            "part2": [
                "Describe a time when you helped someone. You should say: who you helped, "
                "what you did, why you helped them, and explain how you felt afterwards. "
                "You have one minute to prepare, then speak for 1-2 minutes.",
                "Describe a skill you would like to learn. You should say: what it is, "
                "how you would learn it, why it is useful, and explain how it would change your life.",
            ],
            "part3": [
                "How important is it for people to help each other in today's society?",
                "Do you think technology has made people more or less connected? Why?",
                "In what ways can governments encourage people to volunteer in their communities?",
            ],
        }
        import random
        bank = prompts.get(part, prompts["part1"])
        return random.choice(bank)

    async def generate_grammar_exercise(self, exercise_type: str, difficulty: str) -> Dict[str, str]:
        """Generate a grammar exercise using the LLM."""
        system_prompt = "You are an English grammar teacher. Generate one grammar exercise and return ONLY a JSON object."
        user_prompt = f"""
Generate a {difficulty} level {exercise_type} grammar exercise.

Return ONLY this JSON:
{{
  "prompt": "<the exercise question or sentence for the student>",
  "hint": "<optional grammar rule hint>",
  "correct_answer": "<the correct answer>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "prompt": data.get("prompt", "Correct the following sentence: He go to school every day."),
                "hint": data.get("hint", ""),
                "correct_answer": data.get("correct_answer", ""),
            }
        except Exception:
            return {
                "prompt": "Correct the following sentence: She don't like coffee.",
                "hint": "Subject-verb agreement",
                "correct_answer": "She doesn't like coffee.",
            }

    async def generate_vocabulary_word(self, difficulty: str) -> Dict[str, str]:
        """Generate a new vocabulary word with definition and example."""
        system_prompt = "You are a vocabulary teacher. Generate a vocabulary word appropriate for English learners and return ONLY a JSON object."
        user_prompt = f"""
Generate one {difficulty} level English vocabulary word suitable for professional communication.

Return ONLY this JSON:
{{
  "word": "<the word>",
  "definition": "<clear, concise definition>",
  "example_sentence": "<natural example sentence using the word>",
  "context_tags": ["<tag1>", "<tag2>"]
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "word": data.get("word", "articulate"),
                "definition": data.get("definition", "Able to express thoughts clearly and effectively."),
                "example_sentence": data.get("example_sentence", "She gave an articulate presentation."),
                "context_tags": data.get("context_tags", ["communication"]),
            }
        except Exception:
            return {
                "word": "articulate",
                "definition": "Able to express thoughts clearly and effectively.",
                "example_sentence": "She gave an articulate presentation to the board.",
                "context_tags": ["communication", "professional"],
            }

    # ── HR Communication Practice ──────────────────────────────────────────

    async def evaluate_hr_turn(self, prompt: str, response: str) -> Dict[str, Any]:
        """Evaluate an HR / behavioural communication response."""
        grammar_score, _ = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)
        system_prompt = (
            "You are a senior HR manager and communication coach. "
            "Evaluate the candidate's HR / behavioural interview response and return ONLY a JSON object."
        )
        user_prompt = f"""
HR Question: {prompt}
Candidate Response: {response}
Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "communication_score": <0-100>,
  "confidence_score": <0-100>,
  "clarity_score": <0-100>,
  "professionalism_score": <0-100>,
  "composite_score": <0-100>,
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence coaching feedback>",
  "ideal_response": "<A strong model answer for this question>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "grammar_score": grammar_score,
                "confidence_score": _safe_score(data.get("confidence_score", conf_score)),
                "communication_score": _safe_score(data.get("communication_score")),
                "clarity_score": _safe_score(data.get("clarity_score")),
                "professionalism_score": _safe_score(data.get("professionalism_score")),
                "composite_score": _safe_score(data.get("composite_score")),
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "corrected_version": data.get("ideal_response"),
            }
        except Exception as exc:
            logger.warning("hr_eval_failed", error=str(exc))
            return {**_FALLBACK_EVAL, "grammar_score": grammar_score, "confidence_score": conf_score}

    async def generate_hr_prompt(self, turn_number: int) -> str:
        questions = [
            "Tell me about yourself and why you are applying for this role.",
            "Describe a time when you faced a major challenge at work. How did you handle it?",
            "What are your greatest strengths, and how do they add value to a team?",
            "Tell me about a situation where you had a conflict with a colleague. How did you resolve it?",
            "Where do you see yourself in five years, and how does this role align with your goals?",
        ]
        return questions[(turn_number - 1) % len(questions)]

    # ── Public Speaking Coach ──────────────────────────────────────────────

    async def evaluate_public_speaking_turn(self, prompt: str, response: str) -> Dict[str, Any]:
        """Evaluate a speech, presentation, or seminar response."""
        grammar_score, _ = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)
        system_prompt = (
            "You are a professional public speaking coach. "
            "Evaluate the following speech/presentation response and return ONLY a JSON object."
        )
        user_prompt = f"""
Speaking task: {prompt}
Speech/response: {response}
Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "confidence_score": <0-100>,
  "clarity_score": <0-100>,
  "organization_score": <0-100>,
  "energy_score": <0-100>,
  "voice_stability_score": <0-100>,
  "composite_score": <0-100>,
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence coaching feedback>",
  "improved_version": "<A polished version of the speech>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "grammar_score": grammar_score,
                "confidence_score": _safe_score(data.get("confidence_score", conf_score)),
                "clarity_score": _safe_score(data.get("clarity_score")),
                "organization_score": _safe_score(data.get("organization_score")),
                "energy_score": _safe_score(data.get("energy_score")),
                "composite_score": _safe_score(data.get("composite_score")),
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "corrected_version": data.get("improved_version"),
            }
        except Exception as exc:
            logger.warning("public_speaking_eval_failed", error=str(exc))
            return {**_FALLBACK_EVAL, "grammar_score": grammar_score, "confidence_score": conf_score}

    async def generate_public_speaking_prompt(self, turn_number: int) -> str:
        tasks = [
            "Give a 60-second introduction speech about yourself as if you are presenting at a professional conference.",
            "Deliver a 60-second speech convincing your audience that remote work is the future of work.",
            "Give a 60-second motivational speech to a team that has just missed a project deadline.",
        ]
        return tasks[(turn_number - 1) % len(tasks)]

    # ── Email Writing Coach ────────────────────────────────────────────────

    async def evaluate_email_turn(self, task: str, response: str) -> Dict[str, Any]:
        """Evaluate a professional email written by the user."""
        grammar_score, _ = await grammar_engine.check_grammar(response)
        system_prompt = (
            "You are a professional business writing coach. "
            "Evaluate the following email response and return ONLY a JSON object."
        )
        user_prompt = f"""
Email task: {task}
Email written by user:
{response}
Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "tone_score": <0-100>,
  "professionalism_score": <0-100>,
  "clarity_score": <0-100>,
  "formatting_score": <0-100>,
  "composite_score": <0-100>,
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence feedback>",
  "corrected_version": "<A polished, professional version of the email>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "grammar_score": grammar_score,
                "tone_score": _safe_score(data.get("tone_score")),
                "professionalism_score": _safe_score(data.get("professionalism_score")),
                "clarity_score": _safe_score(data.get("clarity_score")),
                "formatting_score": _safe_score(data.get("formatting_score")),
                "composite_score": _safe_score(data.get("composite_score")),
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "corrected_version": data.get("corrected_version"),
            }
        except Exception as exc:
            logger.warning("email_eval_failed", error=str(exc))
            return {**_FALLBACK_EVAL, "grammar_score": grammar_score}

    async def generate_email_task(self, turn_number: int) -> str:
        tasks = [
            "Write a professional email to your manager requesting a one-week extension on a project deadline. Be polite, give a reason, and propose a new deadline.",
            "Write a follow-up email to a client after a product demo, summarising key points discussed and suggesting a next meeting.",
            "Write an email to your team announcing that the weekly Friday meeting is cancelled this week and will resume next week.",
        ]
        return tasks[(turn_number - 1) % len(tasks)]

    # ── Storytelling Coach ────────────────────────────────────────────────

    async def evaluate_storytelling_turn(self, prompt: str, response: str) -> Dict[str, Any]:
        """Evaluate a storytelling response for structure, emotion, flow, and creativity."""
        grammar_score, _ = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)
        system_prompt = (
            "You are a professional storytelling and communication coach. "
            "Evaluate the following story response and return ONLY a JSON object."
        )
        user_prompt = f"""
Storytelling prompt: {prompt}
Story told by user: {response}
Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "structure_score": <0-100>,
  "emotion_score": <0-100>,
  "flow_score": <0-100>,
  "vocabulary_score": <0-100>,
  "creativity_score": <0-100>,
  "composite_score": <0-100>,
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence feedback>",
  "improved_version": "<A more engaging retelling of the story>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "grammar_score": grammar_score,
                "confidence_score": conf_score,
                "structure_score": _safe_score(data.get("structure_score")),
                "emotion_score": _safe_score(data.get("emotion_score")),
                "flow_score": _safe_score(data.get("flow_score")),
                "vocabulary_score": _safe_score(data.get("vocabulary_score")),
                "creativity_score": _safe_score(data.get("creativity_score")),
                "composite_score": _safe_score(data.get("composite_score")),
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "corrected_version": data.get("improved_version"),
            }
        except Exception as exc:
            logger.warning("storytelling_eval_failed", error=str(exc))
            return {**_FALLBACK_EVAL, "grammar_score": grammar_score, "confidence_score": conf_score}

    async def generate_storytelling_prompt(self, turn_number: int) -> str:
        prompts = [
            "Tell a short story about a time you overcame a fear. Use a clear beginning, middle, and end.",
            "Tell the story of the biggest lesson you have learned in your life so far.",
            "Tell a story about a moment that completely changed your perspective on something important.",
        ]
        return prompts[(turn_number - 1) % len(prompts)]

    # ── Leadership Communication ───────────────────────────────────────────

    async def evaluate_leadership_turn(self, scenario: str, response: str) -> Dict[str, Any]:
        """Evaluate a leadership communication response."""
        grammar_score, _ = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)
        system_prompt = (
            "You are an executive leadership coach. "
            "Evaluate the following leadership communication response and return ONLY a JSON object."
        )
        user_prompt = f"""
Leadership scenario: {scenario}
Response: {response}
Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "authority_score": <0-100>,
  "empathy_score": <0-100>,
  "clarity_score": <0-100>,
  "decisiveness_score": <0-100>,
  "composite_score": <0-100>,
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence coaching feedback>",
  "ideal_response": "<A strong leadership response>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "grammar_score": grammar_score,
                "confidence_score": conf_score,
                "authority_score": _safe_score(data.get("authority_score")),
                "empathy_score": _safe_score(data.get("empathy_score")),
                "clarity_score": _safe_score(data.get("clarity_score")),
                "decisiveness_score": _safe_score(data.get("decisiveness_score")),
                "composite_score": _safe_score(data.get("composite_score")),
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "corrected_version": data.get("ideal_response"),
            }
        except Exception as exc:
            logger.warning("leadership_eval_failed", error=str(exc))
            return {**_FALLBACK_EVAL, "grammar_score": grammar_score, "confidence_score": conf_score}

    async def generate_leadership_prompt(self, turn_number: int) -> str:
        scenarios = [
            "You are a team lead. One of your team members has been consistently missing deadlines. How do you address this in a one-on-one meeting?",
            "Your team has just delivered a major project successfully. Write what you would say to motivate and appreciate them.",
            "Two senior team members are in a heated disagreement that is affecting team morale. How do you mediate the situation?",
            "You need to delegate a critical task to a junior team member who lacks experience. How do you frame the conversation?",
        ]
        return scenarios[(turn_number - 1) % len(scenarios)]

    # ── Negotiation Practice ───────────────────────────────────────────────

    async def evaluate_negotiation_turn(self, scenario: str, response: str) -> Dict[str, Any]:
        """Evaluate a negotiation roleplay response."""
        grammar_score, _ = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)
        system_prompt = (
            "You are an expert negotiation trainer. "
            "Evaluate the following negotiation response and return ONLY a JSON object."
        )
        user_prompt = f"""
Negotiation scenario: {scenario}
User's negotiation response: {response}
Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "persuasion_score": <0-100>,
  "confidence_score": <0-100>,
  "logic_score": <0-100>,
  "empathy_score": <0-100>,
  "composite_score": <0-100>,
  "counter_argument": "<What the other party would likely say in response>",
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence negotiation coach feedback>",
  "ideal_response": "<A stronger negotiation response>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "grammar_score": grammar_score,
                "confidence_score": _safe_score(data.get("confidence_score", conf_score)),
                "persuasion_score": _safe_score(data.get("persuasion_score")),
                "logic_score": _safe_score(data.get("logic_score")),
                "empathy_score": _safe_score(data.get("empathy_score")),
                "composite_score": _safe_score(data.get("composite_score")),
                "counter_argument": data.get("counter_argument", ""),
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "corrected_version": data.get("ideal_response"),
            }
        except Exception as exc:
            logger.warning("negotiation_eval_failed", error=str(exc))
            return {**_FALLBACK_EVAL, "grammar_score": grammar_score, "confidence_score": conf_score}

    async def generate_negotiation_prompt(self, turn_number: int, role: str = "hr") -> str:
        scenarios = {
            "hr": [
                "You are negotiating your salary with an HR manager. The offer is ₹8 LPA but you want ₹11 LPA based on your experience. Start the negotiation.",
                "The HR manager says: 'We can go up to ₹9 LPA — that is our best offer.' How do you respond to push further?",
                "HR says: 'We appreciate your interest but the budget is fixed.' How do you close the negotiation professionally?",
                "Negotiate a signing bonus since the base salary cannot be increased further.",
            ],
            "client": [
                "A client wants a 30% discount on your service. How do you respond?",
                "The client says: 'Your competitor is offering the same service 20% cheaper.' How do you respond?",
                "Propose a value-based counter-offer that protects your pricing.",
                "Close the deal by offering a non-monetary value addition instead of a discount.",
            ],
        }
        bank = scenarios.get(role, scenarios["hr"])
        return bank[(turn_number - 1) % len(bank)]

    # ── Confidence Booster ─────────────────────────────────────────────────

    async def evaluate_confidence_turn(self, situation: str, response: str) -> Dict[str, Any]:
        """Evaluate a high-pressure confidence challenge response."""
        grammar_score, _ = await grammar_engine.check_grammar(response)
        conf_score = _text_confidence_score(response)
        system_prompt = (
            "You are a confidence and assertiveness coach. "
            "Evaluate how confidently and effectively the user handled the given situation "
            "and return ONLY a JSON object."
        )
        user_prompt = f"""
High-pressure situation: {situation}
User's response: {response}
Grammar score (pre-computed): {grammar_score:.1f}/100

Return ONLY this JSON:
{{
  "confidence_score": <0-100>,
  "assertiveness_score": <0-100>,
  "clarity_score": <0-100>,
  "composure_score": <0-100>,
  "composite_score": <0-100>,
  "mistakes": [<string>, ...],
  "suggestions": [<string>, ...],
  "ai_feedback": "<2-3 sentence confidence coaching feedback>",
  "ideal_response": "<A highly confident version of this response>"
}}
"""
        try:
            raw = await llm_engine.generate_response(prompt=user_prompt, system_prompt=system_prompt)
            data = _extract_json(raw)
            return {
                "grammar_score": grammar_score,
                "confidence_score": _safe_score(data.get("confidence_score", conf_score)),
                "assertiveness_score": _safe_score(data.get("assertiveness_score")),
                "clarity_score": _safe_score(data.get("clarity_score")),
                "composure_score": _safe_score(data.get("composure_score")),
                "composite_score": _safe_score(data.get("composite_score")),
                "mistakes": data.get("mistakes", []),
                "suggestions": data.get("suggestions", []),
                "ai_feedback": data.get("ai_feedback", ""),
                "corrected_version": data.get("ideal_response"),
            }
        except Exception as exc:
            logger.warning("confidence_eval_failed", error=str(exc))
            return {**_FALLBACK_EVAL, "grammar_score": grammar_score, "confidence_score": conf_score}

    async def generate_confidence_prompt(self, turn_number: int) -> str:
        situations = [
            "You walk into a room full of senior executives you have never met. Introduce yourself in 60 seconds — make them remember you.",
            "Your manager publicly criticises your work in front of the entire team. How do you respond calmly and professionally?",
            "You have 90 seconds to pitch your startup idea to a panel of investors. Deliver your pitch.",
            "A difficult client says your product is 'useless' and wants a full refund. Respond confidently and turn the situation around.",
        ]
        return situations[(turn_number - 1) % len(situations)]


skills_evaluator = SkillsEvaluator()
