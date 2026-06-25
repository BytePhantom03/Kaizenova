"""
LLM Engine — powered by Groq API (llama3-70b-8192).
Falls back to a mock evaluator if no API key is set so the app
always works even without a key.
"""
import httpx
import json
import re
from app.config import settings
from app.utils.logger import logger

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class LLMEngine:
    def __init__(self):
        # NOTE: Do NOT read settings here — pydantic-settings hasn't loaded .env yet at import time.
        # Keys are resolved lazily on first call via _get_key().
        self._api_key: str | None = None
        self._model: str | None = None

    def _get_key(self) -> str:
        """Lazily resolve the API key so .env is guaranteed to be loaded."""
        if self._api_key is None:
            raw = settings.ai.GROQ_API_KEY.get_secret_value() if settings.ai.GROQ_API_KEY else ""
            self._api_key = raw.strip()
            self._model = settings.ai.GROQ_MODEL or "llama-3.3-70b-versatile"
            logger.info("groq_engine_init", model=self._model, has_key=bool(self._api_key))
        return self._api_key

    def _has_key(self) -> bool:
        key = self._get_key()
        return bool(key and key != "your_groq_api_key_here")

    async def generate_response(self, prompt: str, system_prompt: str = "", temperature: float = 0.7) -> str:
        if not self._has_key():
            logger.warning("groq_key_missing", message="No Groq API key set. Using mock response.")
            return "Mock response — please set GROQ_API_KEY in backend/.env"

        api_key = self._get_key()
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    GROQ_API_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self._model,
                        "messages": [
                            {"role": "system", "content": system_prompt or "You are a helpful assistant."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": temperature,
                        "max_tokens": 2048,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error("groq_generate_failed", error=str(e))
            return ""

    async def generate_json(self, prompt: str, system_prompt: str = "") -> dict:
        if not self._has_key():
            logger.warning("groq_key_missing", message="No Groq API key. Returning mock eval.")
            return self._mock_eval()

        api_key = self._get_key()
        full_system = (
            (system_prompt or "You are a strict, objective AI evaluator.")
            + " Return ONLY a valid JSON object, no markdown, no extra text."
        )

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(
                    GROQ_API_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self._model,
                        "messages": [
                            {"role": "system", "content": full_system},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.2,
                        "max_tokens": 2048,
                        "response_format": {"type": "json_object"},
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                raw = data["choices"][0]["message"]["content"]
                return json.loads(raw)
        except json.JSONDecodeError as e:
            logger.error("groq_json_parse_failed", error=str(e))
            return self._mock_eval()
        except Exception as e:
            logger.error("groq_json_failed", error=str(e))
            return self._mock_eval()

    def _mock_eval(self) -> dict:
        """Returns a neutral mock evaluation when no API key is set."""
        return {
            "technical_accuracy": 65.0,
            "completeness": 60.0,
            "communication": 70.0,
            "feedback": (
                "Groq API key not configured — this is a mock evaluation. "
                "Add your GROQ_API_KEY to backend/.env for real AI feedback."
            ),
            "correct_concepts": ["Answer submitted successfully"],
            "missing_concepts": ["Set GROQ_API_KEY for real analysis"],
            "wrong_concepts": [],
        }


llm_engine = LLMEngine()
