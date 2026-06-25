from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import httpx
from app.config import settings
from app.utils.logger import logger
import base64

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

class TTSResponse(BaseModel):
    audio_base64: str

@router.post("/tts", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """Generate Text-to-Speech using Sarvam AI"""
    # Handle SecretStr or regular string
    api_key = settings.ai.SARVAM_API_KEY.get_secret_value() if hasattr(settings.ai.SARVAM_API_KEY, 'get_secret_value') else str(settings.ai.SARVAM_API_KEY)
    
    if not api_key or api_key == "your_sarvam_api_key_here":
        raise HTTPException(status_code=400, detail="Sarvam API Key not configured")

    payload = {
        "inputs": [request.text],
        "target_language_code": "en-IN",
        "speaker": "priya",
        "pace": 1.0,
        "speech_sample_rate": 8000,
        "enable_preprocessing": True,
        "model": "bulbul:v3"
    }
    
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                json=payload,
                headers=headers,
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
            if "audios" in data and len(data["audios"]) > 0:
                # The audio is returned as a base64 encoded string
                return {"audio_base64": data["audios"][0]}
            else:
                raise HTTPException(status_code=500, detail="Invalid response from Sarvam AI")
    except httpx.HTTPError as e:
        logger.error(f"Sarvam TTS failed: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to communicate with TTS provider")

@router.post("/stt")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe Speech-to-Text using Sarvam AI"""
    api_key = settings.ai.SARVAM_API_KEY.get_secret_value() if hasattr(settings.ai.SARVAM_API_KEY, 'get_secret_value') else str(settings.ai.SARVAM_API_KEY)
    
    if not api_key or api_key == "your_sarvam_api_key_here":
        raise HTTPException(status_code=400, detail="Sarvam API Key not configured")

    headers = {
        "api-subscription-key": api_key
    }
    
    file_bytes = await file.read()
    files = {
        "file": (file.filename, file_bytes, file.content_type)
    }
    # Note: Using form-data
    data = {
        "model": "saaras:v3",
        "language_code": "en-IN"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sarvam.ai/speech-to-text",
                files=files,
                data=data,
                headers=headers,
                timeout=30.0
            )
            if response.status_code != 200:
                logger.error(f"Sarvam STT failed: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to transcribe audio")
            
            result = response.json()
            return {"transcript": result.get("transcript", "")}
    except httpx.HTTPError as e:
        logger.error(f"Sarvam STT failed: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to communicate with STT provider")
