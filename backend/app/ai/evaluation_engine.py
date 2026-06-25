from app.ai.llm_engine import llm_engine
from app.ai.grammar_engine import grammar_engine
from app.ai.confidence_engine import confidence_engine
from app.utils.logger import logger
from typing import Dict, Any

class EvaluationEngine:
    async def evaluate_answer(
        self, 
        question_text: str, 
        expected_answer: str, 
        candidate_answer: str, 
        audio_file_path: str = None
    ) -> Dict[str, Any]:
        """Orchestrates full evaluation across multiple AI engines."""
        
        grammar_score, grammar_issues = await grammar_engine.check_grammar(candidate_answer)
        
        confidence_data = {"confidence_score": 0.0, "wpm": 0, "pause_count": 0, "filler_word_count": 0}
        if audio_file_path:
            confidence_data = await confidence_engine.analyze_audio(audio_file_path)
        else:
            # Simple text-based heuristic for confidence when audio is missing
            words = candidate_answer.lower().split()
            filler_words = {"um", "uh", "like", "basically", "literally", "actually", "you know"}
            fillers_used = sum(1 for w in words if w in filler_words)
            
            # Base confidence 85, minus 5 for each filler, min 40
            score = max(40.0, 85.0 - (fillers_used * 5.0))
            
            # Bonus if answer flows well (decent length without fillers)
            if len(words) > 20 and fillers_used == 0:
                score = min(100.0, score + 10.0)
                
            confidence_data["confidence_score"] = score
            confidence_data["filler_word_count"] = fillers_used
            
        prompt = f"""
        You are an expert technical interviewer. Evaluate the candidate's answer.
        
        Question: {question_text}
        Expected/Ideal Concepts: {expected_answer}
        Candidate Answer: {candidate_answer}
        
        Provide a JSON response with the following keys strictly:
        - "technical_accuracy": float (0-100)
        - "completeness": float (0-100)
        - "communication": float (0-100)
        - "feedback": string (constructive paragraph)
        - "correct_concepts": list of strings
        - "missing_concepts": list of strings
        - "wrong_concepts": list of strings
        """
        
        system_prompt = "You are a strict, objective AI evaluator. Return ONLY valid JSON."
        
        llm_eval = await llm_engine.generate_json(prompt, system_prompt)
        
        tech_score = llm_eval.get("technical_accuracy", 50.0)
        comp_score = llm_eval.get("completeness", 50.0)
        comm_score = llm_eval.get("communication", 50.0)
        
        composite = (
            (tech_score * 0.40) +
            (comm_score * 0.20) +    # Communication is 20%
            (comp_score * 0.15) +    # Completeness is 15%
            (confidence_data["confidence_score"] * 0.15) + # Confidence is 15%
            (grammar_score * 0.10)   # Grammar is 10%
        )
        
        return {
            "technical_accuracy": round(tech_score, 2),
            "completeness": round(comp_score, 2),
            "communication": round(comm_score, 2),
            "grammar": round(grammar_score, 2),
            "confidence": round(confidence_data["confidence_score"], 2),
            "composite_score": round(composite, 2),
            "correct_concepts": llm_eval.get("correct_concepts", []),
            "missing_concepts": llm_eval.get("missing_concepts", []),
            "wrong_concepts": llm_eval.get("wrong_concepts", []),
            "feedback_text": llm_eval.get("feedback", "No feedback provided."),
            "grammar_issues": grammar_issues,
            "wpm": confidence_data["wpm"],
            "pause_count": confidence_data["pause_count"],
            "filler_word_count": confidence_data["filler_word_count"]
        }

evaluation_engine = EvaluationEngine()
