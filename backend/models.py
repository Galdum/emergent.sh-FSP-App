from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Union
from datetime import datetime
from enum import Enum
import uuid

class SubscriptionTier(str, Enum):
    FREE = "FREE"
    BASIC = "BASIC"
    PREMIUM = "PREMIUM"

class FileType(str, Enum):
    NOTE = "note"
    LINK = "link"
    FILE = "file"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    
class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    subscription_expires: Optional[datetime] = None
    is_active: bool = True

class UserInDB(User):
    password_hash: str

class UserResponse(User):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Progress Models
class TaskProgress(BaseModel):
    task_id: int
    completed: bool = False
    viewed: bool = False
    completed_at: Optional[datetime] = None

class StepProgress(BaseModel):
    step_id: int
    tasks: List[TaskProgress] = []
    unlocked: bool = False

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    steps: List[StepProgress] = []
    current_step: int = 1
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProgressUpdate(BaseModel):
    step_id: int
    task_id: int
    completed: bool
    viewed: bool = True

# Personal Files Models
class PersonalFileBase(BaseModel):
    type: FileType
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None

class PersonalFileCreate(PersonalFileBase):
    pass

class PersonalFile(PersonalFileBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PersonalFileResponse(PersonalFile):
    pass

# Subscription Models
class SubscriptionUpdate(BaseModel):
    tier: SubscriptionTier
    expires: Optional[datetime] = None

# API Response Models
class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    detail: str
    success: bool = False