from fastapi import APIRouter
from .auth import router as auth_router
from .profile import router as profile_router
from .resumes import router as resumes_router
from .interviews import router as interviews_router
from app.api.websocket.interview_ws import router as ws_router
from .analytics import router as analytics_router
from .streaks import router as streaks_router
from .recommendations import router as recommendations_router
from .ai_audio import router as ai_audio_router
from .improvement import router as improvement_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(profile_router, prefix="/profile", tags=["profile"])
api_router.include_router(resumes_router, prefix="/resumes", tags=["resumes"])
api_router.include_router(interviews_router, prefix="/interviews", tags=["interviews"])
api_router.include_router(ws_router, prefix="/ws/interviews", tags=["websocket"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(streaks_router, prefix="/streaks", tags=["streaks"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(ai_audio_router, prefix="/ai", tags=["AI Audio"])
api_router.include_router(improvement_router, prefix="/improvement", tags=["improvement"])

