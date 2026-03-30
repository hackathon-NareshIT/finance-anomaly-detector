from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import bcrypt

from app.config import settings
from app.database import get_db
from app.models import SignupRequest, LoginRequest, TokenResponse
from app.models_db import User

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash password using bcrypt directly (avoids passlib Python 3.12+ crash)."""
    pwd_bytes = password.encode('utf-8')[:72]  # bcrypt max is 72 bytes
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    pwd_bytes = plain.encode('utf-8')[:72]
    return bcrypt.checkpw(pwd_bytes, hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")



@router.post("/signup", response_model=TokenResponse)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    print(f"DEBUG: Signup request for email: {body.email}")
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        print(f"DEBUG: Signup failed - email {body.email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered.")

    if len(body.password) < 6:
        print(f"DEBUG: Signup failed - password too short")
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    try:
        user = User(
            email=body.email,
            hashed_password=hash_password(body.password),
            role="user",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"DEBUG: Signup successful for user ID: {user.id}")
    except Exception as e:
        print(f"DEBUG: Signup database error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return TokenResponse(access_token=token, user_id=str(user.id), email=user.email)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    print(f"DEBUG: Login attempt for email: {body.email}")
    user = db.query(User).filter(User.email == body.email).first()
    
    if not user:
        print(f"DEBUG: Login failed - user not found for email: {body.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if not verify_password(body.password, user.hashed_password):
        print(f"DEBUG: Login failed - password mismatch for email: {body.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    print(f"DEBUG: Login successful for user ID: {user.id}")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return TokenResponse(access_token=token, user_id=str(user.id), email=user.email)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Dependency: validates JWT and returns the User object."""
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


def get_admin_user(current_user: User = Depends(get_current_user)):
    """Dependency: only allows admin role."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user

