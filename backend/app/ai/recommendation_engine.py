from typing import List, Dict, Any
from app.ai.llm_engine import llm_engine

class RecommendationEngine:
    async def generate_study_plan(self, weak_areas: List[str], target_role: str) -> Dict[str, Any]:
        """Generates a study plan based on weak areas identified in an interview."""
        if not weak_areas:
            return {"status": "no_weak_areas", "plan": []}
            
        prompt = f"""
        You are an expert technical career coach.
        The candidate is preparing for a {target_role} role.
        They struggled with the following topics in their last mock interview:
        {', '.join(weak_areas)}
        
        Provide a JSON response with an "action_plan" list.
        Each item in the list must have:
        - "topic": The specific concept to study
        - "resource_type": "article", "video", or "documentation"
        - "estimated_time_minutes": integer
        - "description": Why they should study this
        """
        
        system_prompt = "You are a helpful study planner. Return ONLY valid JSON."
        plan = await llm_engine.generate_json(prompt, system_prompt)
        
        return {
            "status": "success",
            "plan": plan.get("action_plan", [])
        }

recommendation_engine = RecommendationEngine()
