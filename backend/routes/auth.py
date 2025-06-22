from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta
from backend.models import UserCreate, UserLogin, Token, UserResponse, MessageResponse
from backend.auth import (
    authenticate_user, create_access_token, get_password_hash, 
    get_current_user, JWT_EXPIRE_MINUTES
)
from backend.database import get_database
from backend.models import UserInDB, User

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db = Depends(get_database)):
    """Register a new user."""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(email=user_data.email)
    user_in_db = UserInDB(
        **user.dict(),
        password_hash=get_password_hash(user_data.password)
    )
    
    # Save to database
    await db.users.insert_one(user_in_db.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse(**user.dict())
    )

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db = Depends(get_database)):
    """Login user and return JWT token."""
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse(**user.dict())
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(**current_user.dict())