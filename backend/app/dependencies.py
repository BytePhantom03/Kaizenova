from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from jose import JWTError
from app.db.session import get_db
from app.db.redis import get_redis
from app.core.security import verify_token
from app.repositories.user_repository import user_repo
from app.models.database.user import User
from app.core.exceptions import AuthError

# Type alias for mock redis client
Redis = Any

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
) -> User:
    try:
        # Check if token is blacklisted
        is_blacklisted = await redis.get(f"blacklist:{token}")
        if is_blacklisted:
            raise AuthError("Token has been revoked")

        payload = verify_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise AuthError("Invalid token payload")
        import uuid
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise AuthError("Could not validate credentials")
        
    user = await user_repo.get_by_id(db, user_id)
    if user is None:
        raise AuthError("User not found")
    if not user.is_active:
        raise AuthError("User account is inactive")
        
    return user

async def require_verified_email(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified"
        )
    return current_user

async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
) -> User | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
        
    token = auth_header.split(" ")[1]
    try:
        is_blacklisted = await redis.get(f"blacklist:{token}")
        if is_blacklisted:
            return None

        payload = verify_token(token)
        user_id: str = payload.get("sub")
        if not user_id:
            return None
            
        user = await user_repo.get_by_id(db, user_id)
        if user and user.is_active:
            return user
    except Exception:
        return None
        
    return None
