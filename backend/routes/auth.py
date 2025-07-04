from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import timedelta, datetime
import secrets
import json
from google.oauth2 import id_token
from google.auth.transport import requests
from backend.models import (
    UserCreate, UserLogin, Token, UserResponse, MessageResponse,
    ForgotPasswordRequest, ResetPasswordRequest
)
from backend.auth import (
    authenticate_user, create_access_token, get_password_hash, 
    get_current_user, JWT_EXPIRE_MINUTES, validate_password_strength
)
from backend.database import get_database
from backend.models import UserInDB, User
from backend.security import AuditLogger, validate_email
from backend.services.email_service import send_password_reset_email, send_welcome_email

# Import badge functions for login streak tracking
from backend.routes.badges import update_login_streak, check_and_award_badges

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=Token)
async def register(
    user_data: UserCreate,
    request: Request,
    db = Depends(get_database)
):
    """Register a new user."""
    # Validate email format
    if not validate_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    is_valid, message = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Create new user
    user = User(
        email=user_data.email.lower(),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        country_of_origin=user_data.country_of_origin,
        preferred_language=user_data.preferred_language
    )
    
    user_in_db = UserInDB(
        **user.dict(),
        password_hash=get_password_hash(user_data.password)
    )
    
    # Save to database
    await db.users.insert_one(user_in_db.dict())
    
    # Send welcome email
    try:
        await send_welcome_email(user.email, user.first_name)
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
    
    # Log registration
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=user.id,
        action="user_registration",
        details={
            "email": user.email,
            "country": user_data.country_of_origin,
            "language": user_data.preferred_language
        },
        ip_address=request.client.host if request.client else None
    )
    
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
async def login(
    login_data: UserLogin,
    request: Request,
    db = Depends(get_database)
):
    """Login user and return JWT token."""
    # Check for account lockout
    user_data = await db.users.find_one({"email": login_data.email.lower()})
    if user_data and user_data.get("account_locked_until"):
        if datetime.utcnow() < user_data["account_locked_until"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account temporarily locked due to multiple failed login attempts"
            )
    
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        # Track failed login attempts
        if user_data:
            failed_attempts = user_data.get("failed_login_attempts", 0) + 1
            update_data = {
                "failed_login_attempts": failed_attempts,
                "last_failed_login": datetime.utcnow()
            }
            
            # Lock account after 5 failed attempts
            if failed_attempts >= 5:
                update_data["account_locked_until"] = datetime.utcnow() + timedelta(minutes=30)
            
            await db.users.update_one(
                {"email": login_data.email.lower()},
                {"$set": update_data}
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Reset failed login attempts on successful login
    await db.users.update_one(
        {"id": user.id},
        {"$set": {
            "failed_login_attempts": 0,
            "account_locked_until": None
        }}
    )
    
    # Update login streak and check for badges
    try:
        current_streak = await update_login_streak(db, user.id)
        await check_and_award_badges(db, user.id)
    except Exception as e:
        print(f"Failed to update login streak or check badges: {e}")
    
    # Log successful login
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=user.id,
        action="user_login",
        details={"method": "password"},
        ip_address=request.client.host if request.client else None
    )
    
    access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse(**user.dict())
    )

@router.post("/google", response_model=Token)
async def google_login(
    google_token: dict,
    request: Request,
    db = Depends(get_database)
):
    """Login with Google OAuth."""
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            google_token["token"], 
            requests.Request(), 
            audience=None  # Will need to set actual Google Client ID
        )
        
        email = idinfo.get('email')
        given_name = idinfo.get('given_name')
        family_name = idinfo.get('family_name')
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No email found in Google account"
            )
        
        # Check if user exists
        user_data = await db.users.find_one({"email": email.lower()})
        
        if not user_data:
            # Create new user from Google info
            user = User(
                email=email.lower(),
                first_name=given_name,
                last_name=family_name,
                email_verified=True  # Google accounts are pre-verified
            )
            
            user_in_db = UserInDB(
                **user.dict(),
                password_hash=""  # No password for Google users
            )
            
            # Save to database
            await db.users.insert_one(user_in_db.dict())
            user_response = user
        else:
            # Convert existing user
            user_response = User(**user_data)
        
        # Update login streak and check for badges
        try:
            current_streak = await update_login_streak(db, user_response.id)
            await check_and_award_badges(db, user_response.id)
        except Exception as e:
            print(f"Failed to update login streak or check badges: {e}")
        
        # Log successful login
        audit_logger = AuditLogger(db)
        await audit_logger.log_action(
            user_id=user_response.id,
            action="user_login",
            details={"method": "google_oauth"},
            ip_address=request.client.host if request.client else None
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_response.id}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            user=UserResponse(**user_response.dict())
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate with Google"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(**current_user.dict())

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    profile_data: dict,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update current user's profile."""
    # Define allowed fields to update
    allowed_fields = [
        "first_name", "last_name", "country_of_origin", 
        "target_bundesland", "medical_degree_country",
        "years_of_experience", "german_level", "preferred_language"
    ]
    
    # Filter update data
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    # Validate bundesland if provided
    if "target_bundesland" in update_data:
        from backend.security import validate_bundesland
        if not validate_bundesland(update_data["target_bundesland"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Bundesland"
            )
    
    # Validate German level if provided
    if "german_level" in update_data:
        valid_levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
        if update_data["german_level"] not in valid_levels:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid German level. Must be one of: " + ", ".join(valid_levels)
            )
    
    # Update profile
    update_data["updated_at"] = datetime.utcnow()
    update_data["profile_completed"] = all([
        update_data.get(field) or getattr(current_user, field)
        for field in ["first_name", "last_name", "country_of_origin", "target_bundesland"]
    ])
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    
    # Check for badges after profile update (profile completion badge)
    try:
        await check_and_award_badges(db, current_user.id)
    except Exception as e:
        print(f"Failed to check badges after profile update: {e}")
    
    # Log profile update
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="update_profile",
        details={"fields_updated": list(update_data.keys())}
    )
    
    return UserResponse(**updated_user)

@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    current_password: str,
    new_password: str,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Change user's password."""
    # Verify current password
    from backend.auth import verify_password
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    is_valid, message = validate_password_strength(new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Update password
    new_password_hash = get_password_hash(new_password)
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "password_hash": new_password_hash,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Log password change
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="change_password",
        details={"method": "user_initiated"}
    )
    
    return MessageResponse(message="Password changed successfully")

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db = Depends(get_database)
):
    """Request a password reset token."""
    # Check if user exists
    user = await db.users.find_one({"email": request_data.email})
    if not user:
        # Don't reveal if email exists
        return MessageResponse(message="If the email exists, a reset link will be sent")
    
    # Generate secure reset token
    reset_token = secrets.token_urlsafe(32)
    
    # Store reset token with expiration
    await db.password_resets.insert_one({
        "user_id": user["id"],
        "token": reset_token,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=1),
        "used": False
    })
    
    # Send password reset email
    try:
        await send_password_reset_email(request_data.email, reset_token)
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
    
    # Log the action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=user["id"],
        action="password_reset_requested",
        details={"email": request_data.email}
    )
    
    return MessageResponse(
        message="If the email exists, a reset link will be sent"
    )

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: ResetPasswordRequest,
    db = Depends(get_database)
):
    """Reset password using reset token."""
    # Find valid reset token
    reset_record = await db.password_resets.find_one({
        "token": reset_data.token,
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update user password
    new_password_hash = get_password_hash(reset_data.new_password)
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {
            "password_hash": new_password_hash,
            "updated_at": datetime.utcnow(),
            "failed_login_attempts": 0,  # Reset failed attempts
            "account_locked_until": None  # Unlock account
        }}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True}}
    )
    
    # Log password reset
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=reset_record["user_id"],
        action="password_reset_completed",
        details={"method": "reset_token"}
    )
    
    return MessageResponse(message="Password reset successfully")