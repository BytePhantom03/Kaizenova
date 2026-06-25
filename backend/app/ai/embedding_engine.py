import httpx
from app.config import settings
from app.utils.logger import logger
from app.core.exceptions import AIServiceError
from typing import List

class EmbeddingEngine:
    def __init__(self):
        self.base_url = settings.ai.OLLAMA_BASE_URL
        self.model = "bge-m3"
        
    async def get_embedding(self, text: str) -> List[float]:
        payload = {
            "model": self.model,
            "prompt": text
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("embedding", [])
        except Exception as e:
            logger.error("embedding_generation_failed", error=str(e), model=self.model)
            return [0.0] * 1024

embedding_engine = EmbeddingEngine()
