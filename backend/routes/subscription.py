from fastapi import APIRouter, Depends, HTTPException, status
from backend.models import SubscriptionUpdate, UserResponse, MessageResponse, SubscriptionTier
from backend.auth import get_current_user
from backend.database import get_database
from backend.models import UserInDB
from datetime import datetime

router = APIRouter(prefix="/subscription", tags=["subscription"])

@router.get("/", response_model=UserResponse)
async def get_subscription_info(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current user's subscription information."""
    return UserResponse(**current_user.dict())

@router.put("/", response_model=UserResponse)
async def update_subscription(
    subscription_data: SubscriptionUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update user's subscription (for admin/test purposes)."""
    # Update user's subscription
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$set": {
                "subscription_tier": subscription_data.tier,
                "subscription_expires": subscription_data.expires,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get updated user
    updated_user_data = await db.users.find_one({"id": current_user.id})
    updated_user = UserInDB(**updated_user_data)
    
    return UserResponse(**updated_user.dict())

@router.post("/test-upgrade", response_model=UserResponse)
async def test_upgrade_subscription(
    tier: SubscriptionTier,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Test subscription upgrade (for development/testing)."""
    # For testing purposes, allow direct tier changes
    expires = None
    if tier != SubscriptionTier.FREE:
        # Set expiry to 30 days from now for paid tiers
        from datetime import timedelta
        expires = datetime.utcnow() + timedelta(days=30)
    
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$set": {
                "subscription_tier": tier,
                "subscription_expires": expires,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get updated user
    updated_user_data = await db.users.find_one({"id": current_user.id})
    updated_user = UserInDB(**updated_user_data)
    
    return UserResponse(**updated_user.dict())