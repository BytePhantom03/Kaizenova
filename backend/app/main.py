from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.config import settings
from app.db.session import engine
from app.db.redis import redis_manager
from app.core.middleware import CorrelationIdMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.utils.logger import logger
from app.api.v1.router import api_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Kaizenova API...")
    try:
        # Check DB connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection established.")
        
        # Check Redis connection
        await redis_manager.connect()
        
    except Exception as e:
        logger.critical(f"Startup check failed: {e}")
        # Note: Continuing despite failure for local development resilience
        
    yield
    
    # Shutdown
    logger.info("Shutting down Kaizenova API...")
    await redis_manager.disconnect()
    await engine.dispose()

app = FastAPI(
    title=settings.app.PROJECT_NAME,
    description="AI-Powered Adaptive Interview Preparation Platform",
    version=settings.app.VERSION,
    lifespan=lifespan,
    contact={
        "name": "Kaizenova Team",
        "email": "support@kaizenova.com"
    }
)

# Global exception handler to catch unhandled errors and return proper JSON
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    logger.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check backend logs."}
    )

# Middleware (order matters: last added = outermost = runs first)
# Inner middleware first
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(CorrelationIdMiddleware)

# CORS must be outermost so it wraps ALL responses including errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["system"])
async def health_check():
    db_status = "ok"
    redis_status = "ok"
    
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
        
    try:
        client = redis_manager.get_client()
        await client.ping()
    except Exception:
        redis_status = "error"
        
    return {
        "status": "ok" if db_status == "ok" and redis_status == "ok" else "degraded",
        "services": {
            "database": db_status,
            "redis": redis_status,
            "api": "ok"
        }
    }
