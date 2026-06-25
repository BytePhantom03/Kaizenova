from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from app.db.session import get_db
from app.db.redis import get_redis
from app.models.schemas.auth_schema import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse,
    PasswordResetRequest, PasswordResetConfirm, OAuthCallbackRequest
)
from app.services.auth_service import auth_service
from app.repositories.user_repository import profile_repo
from app.core.exceptions import AuthError
from app.dependencies import get_current_user
from app.models.database.user import User

# Type alias for the mock redis client
Redis = Any

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    try:
        user = await auth_service.register_user(db, request)
        return {"message": "Registration successful. Please verify your email.", "user_id": str(user.id)}
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest, 
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return JWT tokens."""
    try:
        access_token, refresh_token, expires_in, user = await auth_service.login_user(db, request)
        
        # Fetch profile to get full_name
        profile = await profile_repo.get_by_user_id(db, user.id)
        full_name = profile.full_name if profile else ""

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60
        )
        
        return TokenResponse(
            access_token=access_token,
            expires_in=expires_in,
            user=UserResponse(
                id=str(user.id),
                email=str(user.email),
                full_name=full_name
            )
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
):
    """Refresh access token using the refresh_token cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    try:
        access_token, expires_in = await auth_service.refresh_access_token(db, redis, refresh_token)
        return TokenResponse(
            access_token=access_token,
            expires_in=expires_in
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis)
):
    """Logout user, blacklist tokens, and clear cookies."""
    auth_header = request.headers.get("Authorization")
    access_token = auth_header.split(" ")[1] if auth_header else ""
    refresh_token = request.cookies.get("refresh_token")
    
    await auth_service.logout_user(redis, access_token, refresh_token)
    response.delete_cookie("refresh_token")
    
    return {"message": "Logged out successfully"}

@router.post("/password-reset-request")
async def request_password_reset(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
):
    """Request a password reset email."""
    await auth_service.initiate_password_reset(db, redis, request.email)
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@router.post("/password-reset-confirm")
async def confirm_password_reset(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
):
    """Confirm password reset with the token."""
    try:
        await auth_service.confirm_password_reset(db, redis, request)
        return {"message": "Password has been reset successfully."}
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/oauth/google")
async def oauth_google(
    request: OAuthCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Exchange Google OAuth code for tokens."""
    access_token, refresh_token, expires_in, is_new_user = await auth_service.authenticate_oauth(
        db, request.code, request.redirect_uri
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "is_new_user": is_new_user
    }
