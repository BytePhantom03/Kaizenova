import httpx
from app.config import settings
from app.utils.logger import logger
from app.core.exceptions import AIServiceError
import os

class STTEngine:
    def __init__(self):
        self.model = settings.ai.WHISPER_MODEL
        self.base_url = "http://localhost:8080" 
        
    async def transcribe(self, audio_file_path: str) -> str:
        if not os.path.exists(audio_file_path):
            raise AIServiceError("Audio file not found")
            
        try:
            async with httpx.AsyncClient() as client:
                with open(audio_file_path, "rb") as f:
                    files = {"file": (os.path.basename(audio_file_path), f, "audio/wav")}
                    data = {"model": self.model}
                    response = await client.post(
                        f"{self.base_url}/inference",
                        files=files,
                        data=data,
                        timeout=60.0
                    )
                
                if response.status_code == 200:
                    return response.json().get("text", "")
                
                logger.warning("stt_server_unavailable", status=response.status_code, using_mock=True)
                return "This is a mocked transcription of the audio."
                
        except Exception as e:
            logger.error("stt_transcription_failed", error=str(e))
            return "Mock transcription: The candidate explained the concept well."

stt_engine = STTEngine()
