from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import paypalrestsdk
import os
import uuid
from backend.auth import get_current_user
from backend.database import get_database

router = APIRouter(prefix="/paypal", tags=["paypal"])

# Configure PayPal SDK
paypalrestsdk.configure({
    "mode": "sandbox",  # Change to "live" for production
    "client_id": os.environ.get("PAYPAL_CLIENT_ID", "test_client_id"),
    "client_secret": os.environ.get("PAYPAL_SECRET", "test_secret")
})

class PayPalSubscriptionRequest(BaseModel):
    plan_type: str  # "BASIC" or "PREMIUM"
    return_url: str
    cancel_url: str

class PayPalSubscriptionResponse(BaseModel):
    agreement_id: Optional[str] = None
    approval_url: Optional[str] = None
    status: str
    message: str

SUBSCRIPTION_PLANS = {
    "BASIC": {
        "name": "FSP Navigator Basic",
        "description": "Acces complet la toți cei 6 pași + funcții bonus",
        "price": "10.00",
        "currency": "EUR",
        "interval": "Month",
        "frequency": 1
    },
    "PREMIUM": {
        "name": "FSP Navigator Premium", 
        "description": "Acces complet + toate funcțiile AI",
        "price": "30.00",
        "currency": "EUR",
        "interval": "Month",
        "frequency": 1
    }
}

@router.post("/create-subscription", response_model=PayPalSubscriptionResponse)
async def create_paypal_subscription(
    request: PayPalSubscriptionRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        if request.plan_type not in SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        plan = SUBSCRIPTION_PLANS[request.plan_type]
        
        # Create billing plan
        billing_plan = paypalrestsdk.BillingPlan({
            "name": plan["name"],
            "description": plan["description"],
            "type": "INFINITE",  # Subscription continues until cancelled
            "payment_definitions": [{
                "name": f"{plan['name']} Payment",
                "type": "REGULAR",
                "frequency": plan["interval"],
                "frequency_interval": str(plan["frequency"]),
                "cycles": "0",  # 0 = infinite
                "amount": {
                    "currency": plan["currency"],
                    "value": plan["price"]
                }
            }],
            "merchant_preferences": {
                "setup_fee": {
                    "currency": plan["currency"],
                    "value": "0"
                },
                "return_url": request.return_url,
                "cancel_url": request.cancel_url,
                "auto_bill_amount": "YES",
                "initial_fail_amount_action": "CONTINUE",
                "max_fail_attempts": "3"
            }
        })
        
        if billing_plan.create():
            print(f"Billing Plan created successfully with ID: {billing_plan.id}")
            
            # Activate the billing plan
            billing_plan_update = paypalrestsdk.BillingPlan.find(billing_plan.id)
            billing_plan_update.replace([{
                "path": "/",
                "value": {
                    "state": "ACTIVE"
                },
                "op": "replace"
            }])
            
            # Create billing agreement
            billing_agreement = paypalrestsdk.BillingAgreement({
                "name": plan["name"],
                "description": plan["description"],
                "start_date": (datetime.utcnow() + timedelta(minutes=10)).strftime('%Y-%m-%dT%H:%M:%SZ'),
                "plan": {
                    "id": billing_plan.id
                },
                "payer": {
                    "payment_method": "paypal"
                }
            })
            
            if billing_agreement.create():
                # Store subscription attempt in database
                subscription_data = {
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["id"],
                    "plan_type": request.plan_type,
                    "provider": "paypal",
                    "agreement_id": None,  # Will be set after approval
                    "billing_plan_id": billing_plan.id,
                    "status": "PENDING_APPROVAL",
                    "amount": float(plan["price"]),
                    "currency": plan["currency"],
                    "created_at": datetime.utcnow(),
                    "approval_url": None
                }
                
                # Find approval URL
                approval_url = None
                for link in billing_agreement.links:
                    if link.rel == "approval_url":
                        approval_url = link.href
                        subscription_data["approval_url"] = approval_url
                        break
                
                await db.payment_transactions.insert_one(subscription_data)
                
                return PayPalSubscriptionResponse(
                    approval_url=approval_url,
                    status="PENDING_APPROVAL",
                    message="Subscription created successfully. Please complete approval."
                )
            else:
                print(f"Error creating billing agreement: {billing_agreement.error}")
                raise HTTPException(status_code=500, detail=f"Failed to create billing agreement: {billing_agreement.error}")
        else:
            print(f"Error creating billing plan: {billing_plan.error}")
            raise HTTPException(status_code=500, detail=f"Failed to create billing plan: {billing_plan.error}")
            
    except Exception as e:
        print(f"PayPal subscription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PayPal subscription error: {str(e)}")

@router.post("/approve-subscription/{token}")
async def approve_subscription(
    token: str,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        # Execute the billing agreement
        billing_agreement = paypalrestsdk.BillingAgreement.execute(token)
        
        if billing_agreement.id:
            # Find the subscription in database and update it
            subscription = await db.payment_transactions.find_one({
                "user_id": current_user["id"],
                "status": "PENDING_APPROVAL",
                "provider": "paypal"
            })
            
            if subscription:
                # Update subscription with agreement details
                await db.payment_transactions.update_one(
                    {"_id": subscription["_id"]},
                    {"$set": {
                        "agreement_id": billing_agreement.id,
                        "status": "ACTIVE",
                        "activated_at": datetime.utcnow(),
                        "paypal_status": billing_agreement.state
                    }}
                )
                
                # Update user subscription tier
                new_tier = subscription["plan_type"]
                await db.users.update_one(
                    {"id": current_user["id"]},
                    {"$set": {
                        "subscription_tier": new_tier,
                        "subscription_status": "ACTIVE",
                        "subscription_provider": "paypal",
                        "paypal_agreement_id": billing_agreement.id,
                        "updated_at": datetime.utcnow()
                    }}
                )
                
                return {
                    "success": True,
                    "agreement_id": billing_agreement.id,
                    "status": billing_agreement.state,
                    "subscription_tier": new_tier,
                    "message": "Subscription activated successfully!"
                }
            else:
                raise HTTPException(status_code=404, detail="Subscription not found")
        else:
            print(f"Error executing billing agreement: {billing_agreement.error}")
            raise HTTPException(status_code=500, detail="Failed to execute billing agreement")
            
    except Exception as e:
        print(f"PayPal approval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PayPal approval error: {str(e)}")

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        # Find user's active PayPal subscription
        user = await db.users.find_one({"id": current_user["id"]})
        
        if not user or user.get("subscription_provider") != "paypal":
            raise HTTPException(status_code=404, detail="No active PayPal subscription found")
        
        agreement_id = user.get("paypal_agreement_id")
        if not agreement_id:
            raise HTTPException(status_code=404, detail="PayPal agreement ID not found")
        
        # Cancel the billing agreement
        billing_agreement = paypalrestsdk.BillingAgreement.find(agreement_id)
        
        if billing_agreement.cancel({"note": "User requested cancellation"}):
            # Update user subscription status
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {
                    "subscription_tier": "FREE",
                    "subscription_status": "CANCELLED",
                    "cancelled_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            # Update transaction record
            await db.payment_transactions.update_one(
                {"user_id": current_user["id"], "agreement_id": agreement_id},
                {"$set": {
                    "status": "CANCELLED",
                    "cancelled_at": datetime.utcnow()
                }}
            )
            
            return {
                "success": True,
                "message": "Subscription cancelled successfully",
                "new_tier": "FREE"
            }
        else:
            print(f"Error cancelling agreement: {billing_agreement.error}")
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")
            
    except Exception as e:
        print(f"PayPal cancellation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PayPal cancellation error: {str(e)}")

@router.get("/subscription-status")
async def get_paypal_subscription_status(
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        # Convert current_user to dict if it's not already
        user_id = current_user.id if hasattr(current_user, 'id') else current_user["id"]
        
        user = await db.users.find_one({"id": user_id})
        
        if not user or user.get("subscription_provider") != "paypal":
            return {
                "has_paypal_subscription": False,
                "status": None,
                "tier": user.get("subscription_tier", "FREE") if user else "FREE"
            }
        
        agreement_id = user.get("paypal_agreement_id")
        if agreement_id:
            # Get current status from PayPal
            try:
                billing_agreement = paypalrestsdk.BillingAgreement.find(agreement_id)
                
                return {
                    "has_paypal_subscription": True,
                    "agreement_id": agreement_id,
                    "status": billing_agreement.state,
                    "tier": user.get("subscription_tier", "FREE"),
                    "next_billing_date": getattr(billing_agreement, 'next_billing_date', None),
                    "amount": getattr(billing_agreement, 'amount', None)
                }
            except Exception as e:
                print(f"Error fetching PayPal status: {e}")
                return {
                    "has_paypal_subscription": True,
                    "agreement_id": agreement_id,
                    "status": user.get("subscription_status", "UNKNOWN"),
                    "tier": user.get("subscription_tier", "FREE"),
                    "error": "Could not fetch current PayPal status"
                }
        
        return {
            "has_paypal_subscription": False,
            "status": None,
            "tier": user.get("subscription_tier", "FREE")
        }
        
    except Exception as e:
        print(f"PayPal status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PayPal status check error: {str(e)}")

@router.post("/webhook")
async def paypal_webhook(request_data: dict, db = Depends(get_database)):
    """
    Handle PayPal IPN (Instant Payment Notification) webhooks
    """
    try:
        event_type = request_data.get("event_type")
        resource = request_data.get("resource", {})
        
        if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            agreement_id = resource.get("id")
            if agreement_id:
                # Update subscription status
                await db.payment_transactions.update_one(
                    {"agreement_id": agreement_id},
                    {"$set": {
                        "status": "ACTIVE",
                        "activated_at": datetime.utcnow(),
                        "paypal_status": "ACTIVE"
                    }}
                )
                
                # Update user tier
                transaction = await db.payment_transactions.find_one({"agreement_id": agreement_id})
                if transaction:
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$set": {
                            "subscription_tier": transaction["plan_type"],
                            "subscription_status": "ACTIVE",
                            "updated_at": datetime.utcnow()
                        }}
                    )
        
        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            agreement_id = resource.get("id")
            if agreement_id:
                # Update subscription status
                await db.payment_transactions.update_one(
                    {"agreement_id": agreement_id},
                    {"$set": {
                        "status": "CANCELLED",
                        "cancelled_at": datetime.utcnow(),
                        "paypal_status": "CANCELLED"
                    }}
                )
                
                # Update user tier to FREE
                transaction = await db.payment_transactions.find_one({"agreement_id": agreement_id})
                if transaction:
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$set": {
                            "subscription_tier": "FREE",
                            "subscription_status": "CANCELLED",
                            "cancelled_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }}
                    )
        
        elif event_type == "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
            agreement_id = resource.get("billing_agreement_id")
            if agreement_id:
                # Log payment failure
                await db.payment_transactions.update_one(
                    {"agreement_id": agreement_id},
                    {"$set": {
                        "last_payment_failed": datetime.utcnow(),
                        "payment_failure_count": {"$inc": 1},
                        "updated_at": datetime.utcnow()
                    }}
                )
        
        return {"status": "webhook_processed"}
        
    except Exception as e:
        print(f"PayPal webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}