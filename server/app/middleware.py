"""
Authentication Middleware — JWT Token Validation Dependency.
Use `get_current_user` as a FastAPI dependency to protect routes.
"""
import logging
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from app.services.auth_service import decode_token
from app.config.db_config import execute_auth_query

logger = logging.getLogger(__name__)

# Use HTTPBearer for Bearer token extraction
security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    FastAPI dependency that extracts and validates the JWT token.
    
    Checks for token in this order:
    1. Authorization: Bearer <token> header
    2. access_token cookie (httpOnly)
    
    Returns the user dict from the database.
    Raises HTTP 401 if token is missing or invalid.
    """
    token = None

    # 1. Check Bearer header
    if credentials:
        token = credentials.credentials

    # 2. Fallback to httpOnly cookie
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please login.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
        
        # Verify this is an access token, not a refresh token
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        # Fetch user from database to ensure they still exist
        user = execute_auth_query(
            "SELECT id, full_name, email, created_at, updated_at FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        return dict(user)

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is expired or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth middleware error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )
