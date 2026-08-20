"""
Auth API Routes — Registration, Login, Token Refresh, Logout.
All auth endpoints are under /api/auth prefix.
"""
import logging
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Response, Request, Depends, status
from pydantic import BaseModel
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    validate_password_strength,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.config.db_config import execute_auth_query
from app.middleware import get_current_user
from jose import JWTError

logger = logging.getLogger(__name__)

router = APIRouter()


# --- Request/Response Models ---

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    message: str
    user: dict
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    created_at: str
    updated_at: str


# --- Helper Functions ---

def _validate_email(email: str) -> bool:
    """Basic email format validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Set httpOnly cookies for both tokens."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/auth",  # Only sent to auth endpoints
    )


def _clear_auth_cookies(response: Response):
    """Clear auth cookies on logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/auth")


# --- Endpoints ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, response: Response):
    """
    Register a new user.
    Validates email format, password strength, and email uniqueness.
    Returns JWT tokens on success.
    """
    # Validate inputs
    if not req.full_name or len(req.full_name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 2 characters"
        )

    if not _validate_email(req.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )

    # Validate password strength (moderate policy)
    is_valid, msg = validate_password_strength(req.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    # Check if email already exists
    existing = execute_auth_query(
        "SELECT id FROM users WHERE email = %s",
        (req.email.lower().strip(),),
        fetch_one=True
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    # Hash password and create user
    hashed_pw = hash_password(req.password)
    user = execute_auth_query(
        """
        INSERT INTO users (full_name, email, password)
        VALUES (%s, %s, %s)
        RETURNING id, full_name, email, created_at, updated_at
        """,
        (req.full_name.strip(), req.email.lower().strip(), hashed_pw),
        fetch_one=True
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

    # Generate tokens
    token_data = {"sub": str(user["id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Set httpOnly cookies
    _set_auth_cookies(response, access_token, refresh_token)

    return {
        "message": "Registration successful",
        "user": {
            "id": str(user["id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "created_at": str(user["created_at"]),
            "updated_at": str(user["updated_at"]),
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


@router.post("/login")
async def login(req: LoginRequest, response: Response):
    """
    Authenticate user with email and password.
    Returns JWT tokens on success.
    """
    if not req.email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )

    # Find user by email
    user = execute_auth_query(
        "SELECT id, full_name, email, password, created_at, updated_at FROM users WHERE email = %s",
        (req.email.lower().strip(),),
        fetch_one=True
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(req.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate tokens
    token_data = {"sub": str(user["id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Set httpOnly cookies
    _set_auth_cookies(response, access_token, refresh_token)

    return {
        "message": "Login successful",
        "user": {
            "id": str(user["id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "created_at": str(user["created_at"]),
            "updated_at": str(user["updated_at"]),
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get the currently authenticated user's full profile.
    Queries all columns including phone, business_name, etc.
    """
    try:
        user = execute_auth_query(
            """
            SELECT id, full_name, email,
                   COALESCE(phone, '') as phone,
                   COALESCE(business_name, '') as business_name,
                   COALESCE(province, '') as province,
                   COALESCE(products, '') as products,
                   COALESCE(export_destinations, '') as export_destinations,
                   created_at, updated_at
            FROM users WHERE id = %s
            """,
            (str(current_user["id"]),),
            fetch_one=True,
        )
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
        return dict(user)
    except HTTPException:
        raise
    except Exception as e:
        # Fallback to basic data from middleware if extra columns query fails
        logger.warning(f"get_me fallback for user {current_user.get('id')}: {e}")
        return {
            "id": str(current_user.get("id", "")),
            "full_name": current_user.get("full_name", ""),
            "email": current_user.get("email", ""),
            "phone": "",
            "business_name": "",
            "province": "",
            "products": "",
            "export_destinations": "",
        }


@router.post("/refresh")
async def refresh_token(request: Request, response: Response, body: RefreshRequest = None):
    """
    Exchange a refresh token for a new access token.
    Accepts refresh token from request body or httpOnly cookie.
    """
    token = None

    # 1. Check request body
    if body and body.refresh_token:
        token = body.refresh_token

    # 2. Fallback to cookie
    if not token:
        token = request.cookies.get("refresh_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is required"
        )

    try:
        payload = decode_token(token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        # Verify user still exists
        user = execute_auth_query(
            "SELECT id, full_name, email FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Generate new access token
        token_data = {"sub": str(user["id"]), "email": user["email"]}
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        # Update cookies
        _set_auth_cookies(response, new_access_token, new_refresh_token)

        return {
            "message": "Token refreshed",
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired or invalid"
        )


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing auth cookies.
    """
    _clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


# --- Update Profile ---

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    business_name: Optional[str] = None
    province: Optional[str] = None
    products: Optional[str] = None
    export_destinations: Optional[str] = None


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update profil pengguna yang sedang login.
    Kolom yang tidak diset tidak akan berubah.
    """
    user_id = current_user["id"]
    updates = {}

    if req.full_name is not None and req.full_name.strip():
        updates["full_name"] = req.full_name.strip()
    if req.phone is not None:
        updates["phone"] = req.phone.strip()
    if req.business_name is not None:
        updates["business_name"] = req.business_name.strip()
    if req.province is not None:
        updates["province"] = req.province.strip()
    if req.products is not None:
        updates["products"] = req.products.strip()
    if req.export_destinations is not None:
        updates["export_destinations"] = req.export_destinations.strip()

    if not updates:
        # Tidak ada yang diubah, kembalikan data existing
        user = execute_auth_query(
            "SELECT id, full_name, email, created_at, updated_at FROM users WHERE id = %s",
            (str(user_id),),
            fetch_one=True,
        )
        return UserResponse(
            id=str(user["id"]),
            full_name=user["full_name"],
            email=user["email"],
            created_at=str(user["created_at"]),
            updated_at=str(user["updated_at"]),
        )

    # Build dynamic SET clause
    set_clauses = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [str(user_id)]

    try:
        # Coba update dulu — kalau kolom belum ada, ALTER TABLE otomatis
        # (Supabase schema harus sudah punya kolom ini, atau akan error 500 dengan pesan jelas)
        updated = execute_auth_query(
            f"""
            UPDATE users
            SET {set_clauses}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, full_name, email,
                      COALESCE(phone, '') as phone,
                      COALESCE(business_name, '') as business_name,
                      COALESCE(province, '') as province,
                      COALESCE(products, '') as products,
                      COALESCE(export_destinations, '') as export_destinations,
                      created_at, updated_at
            """,
            tuple(values),
            fetch_one=True,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")

        return UserResponse(
            id=str(updated["id"]),
            full_name=updated["full_name"],
            email=updated["email"],
            created_at=str(updated["created_at"]),
            updated_at=str(updated["updated_at"]),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error update profile user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memperbarui profil: {str(e)}"
        )

