"""
Grammar Engine — uses LanguageTool if available, otherwise
performs a fast built-in heuristic check so the app never crashes.
"""
import httpx
import re
from app.config import settings
from app.utils.logger import logger
from typing import Tuple

# Basic filler words list for heuristic scoring
FILLER_WORDS = {"um", "uh", "like", "basically", "literally", "actually", "you know", "kind of", "sort of"}


def _heuristic_grammar_score(text: str) -> Tuple[float, list]:
    """
    Quick local grammar heuristic when LanguageTool isn't available.
    Checks filler words, sentence length, and basic punctuation.
    """
    issues = []
    words = text.lower().split()
    filler_count = sum(1 for w in words if w in FILLER_WORDS)

    if filler_count > 5:
        issues.append({"message": f"High filler word usage ({filler_count} instances)", "context": ""})

    # Check for very long sentences (likely run-ons)
    sentences = re.split(r"[.!?]+", text)
    for s in sentences:
        if len(s.split()) > 60:
            issues.append({"message": "Very long sentence detected — consider breaking it up.", "context": s[:80]})

    score = max(50.0, 100.0 - (len(issues) * 8.0) - (filler_count * 2.0))
    return round(min(score, 100.0), 2), issues


class GrammarEngine:
    def __init__(self):
        self.base_url = settings.ai.LANGUAGETOOL_URL

    async def check_grammar(self, text: str) -> Tuple[float, list]:
        """Returns (grammar_score 0-100, list_of_issues). Never raises."""
        if not text.strip():
            return 100.0, []

        # Try LanguageTool first
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    self.base_url,
                    data={"text": text, "language": "en-US"},
                )
                if response.status_code == 200:
                    data = response.json()
                    matches = data.get("matches", [])
                    score = max(50.0, 100.0 - (len(matches) * 5.0))
                    issues = [
                        {
                            "message": m.get("message"),
                            "context": m.get("context", {}).get("text", ""),
                            "replacements": [r.get("value") for r in m.get("replacements", [])[:3]],
                        }
                        for m in matches
                    ]
                    return round(score, 2), issues
        except Exception:
            # LanguageTool not running — use heuristic silently
            pass

        return _heuristic_grammar_score(text)


grammar_engine = GrammarEngine()
