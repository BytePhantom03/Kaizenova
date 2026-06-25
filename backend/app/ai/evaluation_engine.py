"""
Evaluation Engine — Implements the Kaizenova Adaptive Interview Blueprint.

Scoring Model (from blueprint):
  Technical Knowledge  = 40%
  Problem Solving      = 20%
  Communication        = 15%
  Confidence           = 10%
  Grammar              = 5%
  Consistency          = 10%

Every answer is evaluated deeply by Groq (llama3-70b-8192).
The engine also generates targeted follow-up questions and
detects weaknesses for the adaptive difficulty engine.
"""
from app.ai.llm_engine import llm_engine
from app.ai.grammar_engine import grammar_engine
from app.ai.confidence_engine import confidence_engine
from app.utils.logger import logger
from typing import Dict, Any


EVALUATION_PROMPT_TEMPLATE = """\
You are a world-class senior technical interviewer conducting a real interview.

## Interview Context
Domain / Role: {domain}
Current Difficulty Level: {difficulty}/10
Question Number: {question_number}

## Question Asked
{question_text}

## Ideal Answer Concepts
{expected_answer}

## Candidate's Answer
{candidate_answer}

## Your Task
Evaluate the answer across all dimensions and return a JSON object.

### Scoring Criteria
- technical_accuracy (0-100): How correct and precise is the technical content?
- problem_solving (0-100): Does the candidate show structured thinking and problem-solving ability?
- communication (0-100): Is the answer clear, professional, and well-structured?
- completeness (0-100): Did the candidate cover all important aspects?

### Concept Analysis
- correct_concepts: List every concept the candidate correctly explained.
- missing_concepts: List important concepts that were completely absent.
- wrong_concepts: List any technically incorrect statements.

### Candidate Assessment
- knowledge_level: One of "beginner", "intermediate", "advanced", "expert"
- shows_weakness: true if the answer reveals a significant knowledge gap
- weakness_area: The specific weak topic (e.g., "database indexing") if shows_weakness is true
- needs_followup: true if the answer is superficial and needs deeper probing
- followup_question: A sharp, probing follow-up question if needs_followup is true
- candidate_confidence_signal: "high", "medium", or "low" based on writing style
- feedback: A constructive, encouraging paragraph (2-4 sentences) as a real interviewer would give.

Return ONLY a valid JSON object with all these keys.
"""


class EvaluationEngine:
    async def evaluate_answer(
        self,
        question_text: str,
        expected_answer: str,
        candidate_answer: str,
        audio_file_path: str = None,
        domain: str = "General",
        difficulty: int = 5,
        question_number: int = 1,
    ) -> Dict[str, Any]:
        """
        Orchestrates full evaluation across multiple AI engines.
        Implements the Kaizenova adaptive interview blueprint.
        """

        # ── 1. Grammar Analysis ───────────────────────────────────────────────
        grammar_score, grammar_issues = await grammar_engine.check_grammar(candidate_answer)

        # ── 2. Confidence Analysis ────────────────────────────────────────────
        confidence_data = {
            "confidence_score": 0.0,
            "wpm": 0,
            "pause_count": 0,
            "filler_word_count": 0,
        }
        if audio_file_path:
            confidence_data = await confidence_engine.analyze_audio(audio_file_path)
        else:
            words = candidate_answer.lower().split() if candidate_answer else []
            filler_words = {"um", "uh", "like", "basically", "literally", "actually", "you know", "right", "so"}
            fillers_used = sum(1 for w in words if w in filler_words)

            # Heuristic: base 80 minus 5 per filler, bonus for long clear answers
            score = max(40.0, 80.0 - (fillers_used * 5.0))
            if len(words) > 30 and fillers_used == 0:
                score = min(100.0, score + 10.0)
            elif len(words) < 15:
                score = max(40.0, score - 15.0)  # Very short answers signal low confidence

            confidence_data["confidence_score"] = score
            confidence_data["filler_word_count"] = fillers_used
            confidence_data["wpm"] = len(words)

        # ── 3. LLM Deep Evaluation (Groq) ─────────────────────────────────────
        prompt = EVALUATION_PROMPT_TEMPLATE.format(
            domain=domain,
            difficulty=difficulty,
            question_number=question_number,
            question_text=question_text,
            expected_answer=expected_answer or "Not specified — judge based on general knowledge.",
            candidate_answer=candidate_answer or "(No answer provided — candidate did not respond.)",
        )

        system_prompt = (
            "You are a strict, objective senior interviewer. "
            "Your evaluations are precise, fair, and always constructive. "
            "Return ONLY valid JSON."
        )

        llm_eval = await llm_engine.generate_json(prompt, system_prompt)

        # ── 4. Extract Scores ─────────────────────────────────────────────────
        tech_score = float(llm_eval.get("technical_accuracy", 50.0))
        prob_score = float(llm_eval.get("problem_solving", 50.0))
        comm_score = float(llm_eval.get("communication", 50.0))
        comp_score = float(llm_eval.get("completeness", 50.0))

        # ── 5. Composite Score (per blueprint weighting) ──────────────────────
        # Technical Knowledge = 40%, Problem Solving = 20%, Communication = 15%
        # Confidence = 10%, Grammar = 5%, Consistency (completeness proxy) = 10%
        composite = (
            (tech_score * 0.40) +
            (prob_score * 0.20) +
            (comm_score * 0.15) +
            (confidence_data["confidence_score"] * 0.10) +
            (grammar_score * 0.05) +
            (comp_score * 0.10)
        )

        return {
            "technical_accuracy": round(tech_score, 2),
            "problem_solving": round(prob_score, 2),
            "completeness": round(comp_score, 2),
            "communication": round(comm_score, 2),
            "grammar": round(grammar_score, 2),
            "confidence": round(confidence_data["confidence_score"], 2),
            "composite_score": round(composite, 2),
            "correct_concepts": llm_eval.get("correct_concepts", []),
            "missing_concepts": llm_eval.get("missing_concepts", []),
            "wrong_concepts": llm_eval.get("wrong_concepts", []),
            "feedback_text": llm_eval.get("feedback", "Answer evaluated."),
            "grammar_issues": grammar_issues,
            "wpm": confidence_data["wpm"],
            "pause_count": confidence_data["pause_count"],
            "filler_word_count": confidence_data["filler_word_count"],
            # Adaptive intelligence fields (used by interview_service)
            "knowledge_level": llm_eval.get("knowledge_level", "intermediate"),
            "shows_weakness": llm_eval.get("shows_weakness", False),
            "weakness_area": llm_eval.get("weakness_area", ""),
            "needs_followup": llm_eval.get("needs_followup", False),
            "followup_question": llm_eval.get("followup_question", ""),
            "candidate_confidence_signal": llm_eval.get("candidate_confidence_signal", "medium"),
        }


evaluation_engine = EvaluationEngine()
