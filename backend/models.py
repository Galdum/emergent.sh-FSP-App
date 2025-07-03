from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Union, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class DocumentType(str, Enum):
    DIPLOMA = "diploma"
    TRANSCRIPT = "transcript"
    POLICE_CERTIFICATE = "police_certificate"
    CV = "cv"
    PASSPORT = "passport"
    LANGUAGE_CERTIFICATE = "language_certificate"
    OTHER = "other"

class FileType(str, Enum):
    NOTE = "note"
    LINK = "link"
    FILE = "file"

class SubscriptionTier(str, Enum):
    FREE = "FREE"
    BASIC = "BASIC"
    PREMIUM = "PREMIUM"
    ENTERPRISE = "ENTERPRISE"

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    is_admin: bool = False
    role: UserRole = UserRole.USER
    last_login: Optional[datetime] = None
    email_verified: bool = False
    profile_completed: bool = False
    
    # ApprobMed specific fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country_of_origin: Optional[str] = None
    target_bundesland: Optional[str] = None
    medical_degree_country: Optional[str] = None
    years_of_experience: Optional[int] = None
    german_level: Optional[str] = None  # A1, A2, B1, B2, C1, C2
    preferred_language: str = "en"  # en, de, ro
    
    @validator('email')
    def email_to_lower(cls, v):
        return v.lower()

class UserInDB(User):
    password_hash: str
    admin_granted_by: Optional[str] = None
    admin_granted_at: Optional[datetime] = None
    subscription_tier: str = "FREE"
    subscription_expires: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    failed_login_attempts: int = 0
    last_failed_login: Optional[datetime] = None
    account_locked_until: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country_of_origin: Optional[str] = None
    preferred_language: str = "en"
    
    @validator('email')
    def email_to_lower(cls, v):
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
    @validator('email')
    def email_to_lower(cls, v):
        return v.lower()

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime
    is_active: bool
    is_admin: bool
    role: UserRole
    email_verified: bool
    profile_completed: bool
    first_name: Optional[str]
    last_name: Optional[str]
    country_of_origin: Optional[str]
    target_bundesland: Optional[str]
    german_level: Optional[str]
    preferred_language: str
    subscription_tier: str
    subscription_expires: Optional[datetime]

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Password Reset Models
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    
    @validator('email')
    def email_to_lower(cls, v):
        return v.lower()

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class PasswordReset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Progress Models
class TaskProgress(BaseModel):
    task_id: str
    title: str
    description: Optional[str] = None
    completed: bool = False
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

class StepProgress(BaseModel):
    step_id: str
    title: str
    description: Optional[str] = None
    order: int
    tasks: List[TaskProgress] = []
    completed: bool = False
    completed_at: Optional[datetime] = None

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    bundesland: str
    current_step: int = 0
    steps: List[StepProgress] = []
    overall_progress: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProgressUpdate(BaseModel):
    step_id: int
    task_id: int
    completed: bool
    viewed: bool = True

# Personal Files Models
class PersonalFile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: FileType  # note, link, file
    title: str
    content: Optional[str] = None  # For notes
    url: Optional[str] = None  # For links
    file_path: Optional[str] = None  # For uploaded files
    file_size: Optional[int] = None
    file_hash: Optional[str] = None  # SHA256 hash for integrity
    mime_type: Optional[str] = None
    document_type: Optional[DocumentType] = None  # For categorizing documents
    is_verified: bool = False  # For document verification status
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []
    
    class Config:
        use_enum_values = True

class PersonalFileCreate(BaseModel):
    type: FileType
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    document_type: Optional[DocumentType] = None
    tags: List[str] = []
    
    class Config:
        use_enum_values = True

class PersonalFileResponse(PersonalFile):
    pass

# Subscription Models
class SubscriptionUpdate(BaseModel):
    tier: str
    expires: Optional[datetime] = None

# API Response Models
class MessageResponse(BaseModel):
    message: str
    details: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    detail: str
    success: bool = False

# Document management for ApprobMed
class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    document_type: DocumentType
    title: str
    description: Optional[str] = None
    file_id: Optional[str] = None  # Reference to PersonalFile
    status: str = "pending"  # pending, uploaded, verified, rejected
    rejection_reason: Optional[str] = None
    bundesland_specific: bool = False
    required_for_bundesland: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    
    class Config:
        use_enum_values = True

# FSP (Fachsprachprüfung) preparation models
class FSPVocabulary(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    german_term: str
    english_translation: str
    romanian_translation: Optional[str] = None
    category: str  # anatomy, symptoms, procedures, etc.
    difficulty: str  # A1-C2
    example_sentence: Optional[str] = None
    audio_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FSPProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    vocabulary_mastered: List[str] = []  # List of vocabulary IDs
    practice_sessions: int = 0
    total_practice_time_minutes: int = 0
    mock_exams_completed: int = 0
    average_mock_score: float = 0.0
    weak_areas: List[str] = []
    strong_areas: List[str] = []
    last_practice_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Gamification models
class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    points: int
    requirement_type: str  # documents_uploaded, vocabulary_learned, etc.
    requirement_value: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserAchievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    achievement_id: str
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)

class UserStats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    total_points: int = 0
    level: int = 1
    documents_uploaded: int = 0
    vocabulary_learned: int = 0
    practice_streak_days: int = 0
    last_activity_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)