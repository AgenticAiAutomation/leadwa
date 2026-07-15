"""
Auth module: signup, login, logout, me endpoints with JWT in httpOnly cookies.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import psycopg
from fastapi import APIRouter, HTTPException, Response, Cookie, Depends
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr


# Config
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["auth"])


# Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    business_name: Optional[str] = None
    whatsapp_number: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    business_name: Optional[str]
    whatsapp_number: Optional[str]
    created_at: str


# Helpers
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user_id(token: Optional[str] = Cookie(None, alias="auth_token")) -> str:
    """Dependency to extract and verify user_id from JWT cookie."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Endpoints
@router.post("/signup", response_model=UserResponse, status_code=201)
async def signup(req: SignupRequest, response: Response):
    """Create new user account."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Check if email already exists
            cur.execute("SELECT id FROM users WHERE email = %s", (req.email,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Email already registered")

            # Create user
            password_hash = hash_password(req.password)
            cur.execute(
                """
                INSERT INTO users (email, password_hash, business_name, whatsapp_number)
                VALUES (%s, %s, %s, %s)
                RETURNING id, email, business_name, whatsapp_number, created_at
                """,
                (req.email, password_hash, req.business_name, req.whatsapp_number)
            )
            row = cur.fetchone()
            conn.commit()

            user_id, email, business_name, whatsapp_number, created_at = row

            # Set JWT cookie
            token = create_access_token(str(user_id))
            response.set_cookie(
                key="auth_token",
                value=token,
                httponly=True,
                max_age=TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                samesite="lax"
            )

            return UserResponse(
                id=str(user_id),
                email=email,
                business_name=business_name,
                whatsapp_number=whatsapp_number,
                created_at=created_at.isoformat()
            )


@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest, response: Response):
    """Login with email and password."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, password_hash, business_name, whatsapp_number, created_at FROM users WHERE email = %s",
                (req.email,)
            )
            row = cur.fetchone()

            if not row or not verify_password(req.password, row[2]):
                raise HTTPException(status_code=401, detail="Invalid credentials")

            user_id, email, _, business_name, whatsapp_number, created_at = row

            # Set JWT cookie
            token = create_access_token(str(user_id))
            response.set_cookie(
                key="auth_token",
                value=token,
                httponly=True,
                max_age=TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                samesite="lax"
            )

            return UserResponse(
                id=str(user_id),
                email=email,
                business_name=business_name,
                whatsapp_number=whatsapp_number,
                created_at=created_at.isoformat()
            )


@router.post("/logout")
async def logout(response: Response):
    """Clear auth cookie."""
    response.delete_cookie(key="auth_token")
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
async def me(user_id: str = Depends(get_current_user_id)):
    """Get current user info."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, business_name, whatsapp_number, created_at FROM users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()

            if not row:
                raise HTTPException(status_code=401, detail="User not found")

            user_id, email, business_name, whatsapp_number, created_at = row

            return UserResponse(
                id=str(user_id),
                email=email,
                business_name=business_name,
                whatsapp_number=whatsapp_number,
                created_at=created_at.isoformat()
            )
