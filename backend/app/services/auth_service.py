import uuid
from typing import Tuple, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

# Type alias for mock redis client
Redis = Any
from app.core.exceptions import AuthError
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, verify_token
from app.repositories.user_repository import user_repo, profile_repo
from app.models.database.user import User
from app.models.schemas.auth_schema import RegisterRequest, LoginRequest, PasswordResetConfirm
from app.utils.email_sender import send_verification_email, send_password_reset_email
from app.config import settings
from app.utils.logger import logger

from jose import JWTError

class AuthService:
    async def register_user(self, db: AsyncSession, request: RegisterRequest) -> User:
        existing_user = await user_repo.get_by_email(db, request.email)
        if existing_user:
            raise AuthError("Email already registered", 409)

        user_data = {
            "email": request.email,
            "password_hash": get_password_hash(request.password)
        }
        user = await user_repo.create(db, user_data)
        
        # Create minimal profile
        await profile_repo.create(db, {
            "user_id": user.id,
            "full_name": request.full_name
        })

        verification_token = str(uuid.uuid4())
        await send_verification_email(request.email, verification_token)
        
        return user

    async def login_user(self, db: AsyncSession, request: LoginRequest) -> Tuple[str, str, int, User]:
        user = await user_repo.get_by_email(db, request.email)
        if not user or not user.password_hash:
            raise AuthError("Invalid credentials", 401)
            
        if not verify_password(request.password, user.password_hash):
            raise AuthError("Invalid credentials", 401)

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        from datetime import datetime, timezone
        await user_repo.update(db, user.id, {"last_login_at": datetime.now(timezone.utc)})
        
        return access_token, refresh_token, settings.security.ACCESS_TOKEN_EXPIRE_MINUTES * 60, user

    async def refresh_access_token(self, db: AsyncSession, redis: Redis, refresh_token: str) -> Tuple[str, int]:
        try:
            is_blacklisted = await redis.get(f"blacklist:{refresh_token}")
            if is_blacklisted:
                raise AuthError("Refresh token revoked", 401)

            payload = verify_token(refresh_token)
            user_id_str = payload.get("sub")
            if not user_id_str:
                raise AuthError("Invalid refresh token", 401)
                
            import uuid
            user_id = uuid.UUID(user_id_str)
            
            user = await user_repo.get_by_id(db, user_id)
            if not user or not user.is_active:
                raise AuthError("User not active", 401)
                
            access_token = create_access_token(data={"sub": str(user.id)})
            return access_token, settings.security.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        except (ValueError, JWTError):
            raise AuthError("Invalid or expired refresh token", 401)

    async def logout_user(self, redis: Redis, access_token: str, refresh_token: str | None = None):
        await redis.setex(f"blacklist:{access_token}", settings.security.ACCESS_TOKEN_EXPIRE_MINUTES * 60, "true")
        if refresh_token:
            await redis.setex(f"blacklist:{refresh_token}", settings.security.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60, "true")

    async def initiate_password_reset(self, db: AsyncSession, redis: Redis, email: str):
        user = await user_repo.get_by_email(db, email)
        if user:
            reset_token = str(uuid.uuid4())
            await redis.setex(f"pwd_reset:{reset_token}", 15 * 60, str(user.id))
            await send_password_reset_email(email, reset_token)

    async def confirm_password_reset(self, db: AsyncSession, redis: Redis, request: PasswordResetConfirm):
        user_id = await redis.get(f"pwd_reset:{request.token}")
        if not user_id:
            raise AuthError("Invalid or expired reset token", 400)
            
        user = await user_repo.get_by_id(db, user_id)
        if not user:
            raise AuthError("User not found", 404)
            
        hashed_password = get_password_hash(request.new_password)
        await user_repo.update(db, user.id, {"password_hash": hashed_password})
        
        await redis.delete(f"pwd_reset:{request.token}")

    async def authenticate_oauth(self, db: AsyncSession, code: str, redirect_uri: str):
        logger.info(f"Real OAuth exchange started")
        
        client_id = settings.oauth.GOOGLE_CLIENT_ID
        client_secret = settings.oauth.GOOGLE_CLIENT_SECRET.get_secret_value() if hasattr(settings.oauth.GOOGLE_CLIENT_SECRET, 'get_secret_value') else settings.oauth.GOOGLE_CLIENT_SECRET
        
        if not client_id or not client_secret or client_id == "your_google_client_id_here":
            raise AuthError("Google OAuth is not configured on the backend.", 500)
            
        async with httpx.AsyncClient() as client:
            # 1. Exchange code for access token
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            }
            token_res = await client.post(token_url, data=data)
            if token_res.status_code != 200:
                logger.error(f"Failed to fetch Google token: {token_res.text}")
                raise AuthError("Failed to authenticate with Google", 401)
                
            token_data = token_res.json()
            google_access_token = token_data.get("access_token")
            
            # 2. Fetch user profile
            userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            userinfo_res = await client.get(
                userinfo_url, 
                headers={"Authorization": f"Bearer {google_access_token}"}
            )
            if userinfo_res.status_code != 200:
                logger.error(f"Failed to fetch Google userinfo: {userinfo_res.text}")
                raise AuthError("Failed to fetch user profile from Google", 401)
                
            user_info = userinfo_res.json()
            email = user_info.get("email")
            oauth_id = user_info.get("id")
            full_name = user_info.get("name") or "Google User"
            
        if not email or not oauth_id:
            raise AuthError("Incomplete profile returned from Google", 401)
            
        is_new_user = False
        user = await user_repo.get_by_email(db, email)
        if not user:
            is_new_user = True
            user = await user_repo.create(db, {
                "email": email,
                "oauth_provider": "google",
                "oauth_id": oauth_id,
                "email_verified": True
            })
            await profile_repo.create(db, {
                "user_id": user.id,
                "full_name": full_name
            })
            
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return access_token, refresh_token, settings.security.ACCESS_TOKEN_EXPIRE_MINUTES * 60, is_new_user, user

auth_service = AuthService()
