import asyncio
import httpx
from app.config import settings

async def test_sarvam():
    api_key = settings.ai.SARVAM_API_KEY.get_secret_value() if hasattr(settings.ai.SARVAM_API_KEY, 'get_secret_value') else str(settings.ai.SARVAM_API_KEY)
    
    payload = {
        "inputs": ["Hello world"],
        "target_language_code": "en-IN",
        "speaker": "anushka",
        "pace": 1.0,
        "speech_sample_rate": 8000,
        "enable_preprocessing": True,
        "model": "bulbul:v3"
    }
    
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.sarvam.ai/text-to-speech",
            json=payload,
            headers=headers
        )
        print("Status:", response.status_code)
        print("Body:", response.text)

asyncio.run(test_sarvam())
