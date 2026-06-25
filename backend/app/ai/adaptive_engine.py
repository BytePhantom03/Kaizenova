from typing import List, Dict, Any

class AdaptiveEngine:
    def calculate_next_difficulty(self, current_difficulty: int, recent_scores: List[float]) -> int:
        """Adjust difficulty (1-10) based on recent performance."""
        if not recent_scores:
            return current_difficulty
            
        avg_score = sum(recent_scores) / len(recent_scores)
        
        if avg_score > 85.0:
            return min(10, current_difficulty + 1)
        elif avg_score < 50.0:
            return max(1, current_difficulty - 1)
            
        return current_difficulty
        
    def select_next_question_domain(self, domain_performance: Dict[str, float]) -> str:
        """Selects the weakest domain to focus on."""
        if not domain_performance:
            return "general"
            
        sorted_domains = sorted(domain_performance.items(), key=lambda item: item[1])
        return sorted_domains[0][0]

adaptive_engine = AdaptiveEngine()
