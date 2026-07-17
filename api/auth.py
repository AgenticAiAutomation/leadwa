"""
Auth module: signup, login, logout, me endpoints with JWT in httpOnly cookies.
Includes Google OAuth 2.0 integration.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
import psycopg
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, HTTPException, Response, Cookie, Depends, Request
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr


# Config
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://api.leadwa.co/auth/google/callback")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth client
oauth = OAuth()
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

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


# Google OAuth endpoints
@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth flow."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")

    redirect_uri = GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, response: Response):
    """Handle Google OAuth callback."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")

    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')

        if not user_info or not user_info.get('email'):
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")

        google_email = user_info['email']
        google_id = user_info.get('sub')  # Google's unique user ID

        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                # Check if user exists by email
                cur.execute(
                    "SELECT id, email, business_name, whatsapp_number, created_at, google_id FROM users WHERE email = %s",
                    (google_email,)
                )
                row = cur.fetchone()

                if row:
                    # User exists - update google_id if not set
                    user_id = row[0]
                    if not row[5] and google_id:
                        cur.execute(
                            "UPDATE users SET google_id = %s WHERE id = %s",
                            (google_id, user_id)
                        )
                        conn.commit()

                    user_data = {
                        'id': str(user_id),
                        'email': row[1],
                        'business_name': row[2],
                        'whatsapp_number': row[3],
                        'created_at': row[4].isoformat()
                    }
                else:
                    # Create new user with Google account
                    cur.execute(
                        """
                        INSERT INTO users (email, password_hash, google_id)
                        VALUES (%s, %s, %s)
                        RETURNING id, email, business_name, whatsapp_number, created_at
                        """,
                        (google_email, '', google_id)
                    )
                    row = cur.fetchone()
                    conn.commit()

                    user_data = {
                        'id': str(row[0]),
                        'email': row[1],
                        'business_name': row[2],
                        'whatsapp_number': row[3],
                        'created_at': row[4].isoformat()
                    }

                # Set JWT cookie
                access_token = create_access_token(user_data['id'])
                response.set_cookie(
                    key="auth_token",
                    value=access_token,
                    httponly=True,
                    max_age=TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                    samesite="lax"
                )

                # Redirect to dashboard
                response.headers["Location"] = "https://leadwa.co/dashboard"
                response.status_code = 302
                return response

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
