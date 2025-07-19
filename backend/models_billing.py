from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed" 
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class SubscriptionPlan(str, Enum):
    FREE = "FREE"
    BASIC = "BASIC"
    PREMIUM = "PREMIUM"

# Payment Transaction Models
class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    email: Optional[str] = None
    session_id: str
    payment_intent_id: Optional[str] = None
    amount: float
    currency: str = "eur"
    status: PaymentStatus = PaymentStatus.PENDING
    payment_status: Optional[str] = None
    subscription_plan: Optional[SubscriptionPlan] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CheckoutSessionCreate(BaseModel):
    subscription_plan: SubscriptionPlan
    user_id: Optional[str] = None
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

class CheckoutSessionResponse(BaseModel):
    url: str
    session_id: str
    transaction_id: str

# Subscription Models
class SubscriptionPlanDetails(BaseModel):
    name: str
    price: float
    currency: str = "eur"
    stripe_price_id: Optional[str] = None
    features: List[str]
    max_steps: int
    max_orange_nodes: int
    has_ai: bool

# Admin Models
class AdminUserResponse(BaseModel):
    id: str
    email: str
    subscription_tier: SubscriptionPlan
    subscription_expires: Optional[datetime]
    created_at: datetime
    is_active: bool
    total_files: int = 0
    total_progress_steps: int = 0

class AdminStatsResponse(BaseModel):
    total_users: int
    active_subscriptions: int
    total_revenue: float
    users_by_plan: Dict[str, int]
    transactions_today: int
    revenue_today: float

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    action: str
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    error_type: str
    error_message: str
    stack_trace: Optional[str] = None
    url: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False

class FeatureFlag(BaseModel):
    name: str
    enabled: bool
    description: Optional[str] = None
    user_groups: List[str] = []
    rollout_percentage: float = 100.0