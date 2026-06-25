"""
Grammar Engine — uses LanguageTool if available, otherwise
performs a fast built-in heuristic check so the app never crashes.

Grammar score reflects BOTH correctness AND answer quality:
- Empty or trivially short answers → 0% (no meaningful communication)
- Filler-heavy answers → penalized
- Run-on sentences → penalized
- LanguageTool matches → penalized per error
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
    Local grammar heuristic when LanguageTool isn't available.
    Checks filler words, sentence length, and basic punctuation.
    Score reflects COMMUNICATION QUALITY, not just technical correctness.
    """
    issues = []
    words = text.strip().split()
    word_count = len(words)

    # Very short answers — not meaningful communication
    if word_count < 5:
        return 0.0, [{"message": "Answer is too short to assess grammar quality.", "context": text}]

    if word_count < 15:
        issues.append({"message": "Answer is too brief — more detail expected.", "context": text})

    filler_count = sum(1 for w in words if w.lower() in FILLER_WORDS)
    if filler_count > 3:
        issues.append({"message": f"High filler word usage ({filler_count} instances)", "context": ""})

    # Check for very long run-on sentences
    sentences = re.split(r"[.!?]+", text)
    for s in sentences:
        if len(s.split()) > 60:
            issues.append({"message": "Very long sentence detected — consider breaking it up.", "context": s[:80]})

    # Check for lack of punctuation (one long run-on with no sentence breaks)
    if word_count > 30 and len(sentences) == 1:
        issues.append({"message": "Missing sentence punctuation — use periods and commas.", "context": ""})

    # Base starts at 85 (not 100) — earned through quality
    base = 85.0
    penalty = (len(issues) * 10.0) + (filler_count * 3.0)
    score = max(10.0, base - penalty)  # floor is 10, not 50
    return round(min(score, 85.0), 2), issues  # cap at 85 — perfect needs LanguageTool


class GrammarEngine:
    def __init__(self):
        self.base_url = settings.ai.LANGUAGETOOL_URL

    async def check_grammar(self, text: str) -> Tuple[float, list]:
        """Returns (grammar_score 0-100, list_of_issues). Never raises."""
        stripped = text.strip() if text else ""

        # Empty or trivially short — not assessable
        if not stripped or len(stripped.split()) < 5:
            return 0.0, [{"message": "No meaningful answer provided.", "context": ""}]

        # Try LanguageTool first
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    self.base_url,
                    data={"text": stripped, "language": "en-US"},
                )
                if response.status_code == 200:
                    data = response.json()
                    matches = data.get("matches", [])
                    word_count = len(stripped.split())
                    # Penalize proportionally to length — more errors per word = worse score
                    error_rate = len(matches) / max(word_count, 1)
                    score = max(10.0, 100.0 - (error_rate * 100 * 3) - (len(matches) * 2.0))
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

        return _heuristic_grammar_score(stripped)


grammar_engine = GrammarEngine()
