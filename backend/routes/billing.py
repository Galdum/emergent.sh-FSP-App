from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict
from backend.models_billing import (
    CheckoutSessionCreate, CheckoutSessionResponse, PaymentTransaction,
    SubscriptionPlan, AuditLog
)
from ..auth import get_current_user
from ..database import get_database
from ..models import UserInDB
from ..services.stripe_service import stripe_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])

@router.get("/plans")
async def get_subscription_plans():
    """Get all available subscription plans."""
    return await stripe_service.get_subscription_plans()

@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: Request,
    checkout_data: CheckoutSessionCreate,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a Stripe checkout session for subscription upgrade."""
    
    # Get the origin URL from request headers
    origin = request.headers.get("origin") or "http://localhost:3000"
    
    # Construct success and cancel URLs
    success_url = f"{origin}/subscription-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/subscription-cancelled"
    
    try:
        # Create checkout session
        session_data = await stripe_service.create_subscription_checkout(
            plan=checkout_data.subscription_plan,
            user_id=current_user.id,
            user_email=current_user.email,
            success_url=success_url,
            cancel_url=cancel_url
        )
        
        # Log audit event
        audit_log = AuditLog(
            user_id=current_user.id,
            action="checkout_session_created",
            details={
                "plan": checkout_data.subscription_plan.value,
                "session_id": session_data["session_id"]
            },
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        await db.audit_logs.insert_one(audit_log.dict())
        
        return CheckoutSessionResponse(**session_data)
        
    except Exception as e:
        logger.error(f"Failed to create checkout session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create checkout session: {str(e)}"
        )

@router.get("/payment-status/{session_id}")
async def get_payment_status(
    session_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Check payment status for a checkout session."""
    
    try:
        # Verify the session belongs to the current user
        transaction = await db.payment_transactions.find_one({
            "session_id": session_id,
            "user_id": current_user.id
        })
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment session not found"
            )
        
        # Get updated payment status from Stripe
        payment_result = await stripe_service.verify_payment(session_id)
        
        return payment_result
        
    except Exception as e:
        logger.error(f"Failed to check payment status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to check payment status: {str(e)}"
        )

@router.get("/transactions", response_model=List[PaymentTransaction])
async def get_user_transactions(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's payment transactions."""
    
    transactions_cursor = db.payment_transactions.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1)
    
    transactions_data = await transactions_cursor.to_list(100)
    return [PaymentTransaction(**tx) for tx in transactions_data]

@router.post("/cancel-subscription")
async def cancel_subscription(
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Cancel user's current subscription."""
    
    try:
        await stripe_service.cancel_subscription(current_user.id)
        
        # Log audit event
        audit_log = AuditLog(
            user_id=current_user.id,
            action="subscription_cancelled",
            details={"previous_plan": current_user.subscription_tier},
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        await db.audit_logs.insert_one(audit_log.dict())
        
        return {"message": "Subscription cancelled successfully"}
        
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to cancel subscription: {str(e)}"
        )