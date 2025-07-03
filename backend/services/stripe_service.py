import os
from typing import Dict, Optional
# Mock for emergentintegrations
class CheckoutSessionRequest:
    def __init__(self, stripe_price_id, quantity, success_url, cancel_url, metadata):
        self.stripe_price_id = stripe_price_id
        self.quantity = quantity
        self.success_url = success_url
        self.cancel_url = cancel_url
        self.metadata = metadata

class CheckoutSessionResponse:
    def __init__(self, url, session_id):
        self.url = url
        self.session_id = session_id

class StripeCheckout:
    def __init__(self, api_key):
        self.api_key = api_key
        
    async def create_checkout_session(self, request):
        # Mock implementation
        return CheckoutSessionResponse(
            url=f"https://checkout.stripe.com/pay/mock_{request.stripe_price_id}",
            session_id=f"cs_test_{os.urandom(8).hex()}"
        )
        
    async def get_checkout_status(self, session_id):
        # Mock implementation
        return type('obj', (object,), {
            'payment_status': 'paid',
            'status': 'complete',
            'amount_total': 1000  # $10.00
        })

from backend.models_billing import PaymentTransaction, SubscriptionPlan, SubscriptionPlanDetails, PaymentStatus
from backend.database import get_database
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Subscription plan configuration
SUBSCRIPTION_PLANS = {
    SubscriptionPlan.FREE: SubscriptionPlanDetails(
        name="Free",
        price=0.0,
        stripe_price_id=None,
        features=["First 2 steps", "1 bonus feature", "Personal file access"],
        max_steps=2,
        max_orange_nodes=1,
        has_ai=False
    ),
    SubscriptionPlan.BASIC: SubscriptionPlanDetails(
        name="Basic", 
        price=10.0,
        stripe_price_id=os.environ.get("STRIPE_BASIC_PRICE_ID"),
        features=["All 6 steps", "All bonus features", "Personal file access", "Detailed guides"],
        max_steps=6,
        max_orange_nodes=4,
        has_ai=False
    ),
    SubscriptionPlan.PREMIUM: SubscriptionPlanDetails(
        name="Premium",
        price=30.0,
        stripe_price_id=os.environ.get("STRIPE_PREMIUM_PRICE_ID"),
        features=["All 6 steps", "All bonus features", "Personal file access", "Detailed guides", "Full AI support", "FSP AI tutor", "AI email generator"],
        max_steps=6,
        max_orange_nodes=4,
        has_ai=True
    )
}

class StripeService:
    def __init__(self):
        self.stripe_api_key = os.environ.get("STRIPE_SECRET_KEY")
        if self.stripe_api_key:
            self.stripe_checkout = StripeCheckout(api_key=self.stripe_api_key)
            self._initialized = True
        else:
            self.stripe_checkout = None
            self._initialized = False
            logger.warning("STRIPE_SECRET_KEY not found - Stripe functionality disabled")
    
    def _check_initialized(self):
        if not self._initialized:
            raise ValueError("Stripe service not initialized - missing STRIPE_SECRET_KEY environment variable")
    
    async def create_subscription_checkout(
        self, 
        plan: SubscriptionPlan, 
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        success_url: str = None,
        cancel_url: str = None
    ) -> Dict[str, str]:
        """Create a Stripe checkout session for subscription."""
        self._check_initialized()
        
        if plan == SubscriptionPlan.FREE:
            raise ValueError("Cannot create checkout for free plan")
        
        plan_details = SUBSCRIPTION_PLANS[plan]
        if not plan_details.stripe_price_id:
            raise ValueError(f"Stripe price ID not configured for {plan.value} plan")
        
        # Create checkout session request
        checkout_request = CheckoutSessionRequest(
            stripe_price_id=plan_details.stripe_price_id,
            quantity=1,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "subscription_plan": plan.value,
                "user_id": user_id or "",
                "user_email": user_email or "",
                "source": "subscription_checkout"
            }
        )
        
        # Create checkout session with Stripe
        session_response = await self.stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        db = await get_database()
        transaction = PaymentTransaction(
            user_id=user_id,
            email=user_email,
            session_id=session_response.session_id,
            amount=plan_details.price,
            currency="eur",
            status=PaymentStatus.PENDING,
            subscription_plan=plan,
            metadata=checkout_request.metadata
        )
        
        await db.payment_transactions.insert_one(transaction.dict())
        logger.info(f"Created payment transaction {transaction.id} for user {user_id}")
        
        return {
            "url": session_response.url,
            "session_id": session_response.session_id,
            "transaction_id": transaction.id
        }
    
    async def verify_payment(self, session_id: str) -> Dict[str, any]:
        """Verify payment status and update records."""
        self._check_initialized()
        
        # Get checkout status from Stripe
        checkout_status = await self.stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        db = await get_database()
        transaction_data = await db.payment_transactions.find_one({"session_id": session_id})
        
        if not transaction_data:
            raise ValueError(f"Transaction not found for session {session_id}")
        
        transaction = PaymentTransaction(**transaction_data)
        
        # Prevent duplicate processing
        if transaction.status == PaymentStatus.COMPLETED:
            logger.warning(f"Transaction {transaction.id} already completed")
            return {
                "status": "already_processed",
                "transaction": transaction.dict()
            }
        
        # Update transaction status
        new_status = PaymentStatus.PENDING
        if checkout_status.payment_status == "paid":
            new_status = PaymentStatus.COMPLETED
        elif checkout_status.status == "expired":
            new_status = PaymentStatus.EXPIRED
        elif checkout_status.status == "cancelled":
            new_status = PaymentStatus.CANCELLED
        
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": new_status.value,
                    "payment_status": checkout_status.payment_status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # If payment successful, update user subscription
        if new_status == PaymentStatus.COMPLETED and transaction.user_id:
            await self._update_user_subscription(
                transaction.user_id, 
                transaction.subscription_plan
            )
            logger.info(f"Updated subscription for user {transaction.user_id} to {transaction.subscription_plan}")
        
        return {
            "status": new_status.value,
            "payment_status": checkout_status.payment_status,
            "transaction": transaction.dict(),
            "amount": checkout_status.amount_total / 100  # Convert from cents
        }
    
    async def _update_user_subscription(self, user_id: str, plan: SubscriptionPlan):
        """Update user's subscription plan."""
        db = await get_database()
        
        # Set subscription expiry (30 days for paid plans)
        expires = None
        if plan != SubscriptionPlan.FREE:
            expires = datetime.utcnow() + timedelta(days=30)
        
        await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "subscription_tier": plan.value,
                    "subscription_expires": expires,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def get_subscription_plans(self) -> Dict[str, SubscriptionPlanDetails]:
        """Get all available subscription plans."""
        return {plan.value: details.dict() for plan, details in SUBSCRIPTION_PLANS.items()}
    
    async def cancel_subscription(self, user_id: str):
        """Cancel user subscription (downgrade to free)."""
        await self._update_user_subscription(user_id, SubscriptionPlan.FREE)
        logger.info(f"Cancelled subscription for user {user_id}")

# Global service instance - initialize conditionally
stripe_service = None

def get_stripe_service():
    global stripe_service
    if stripe_service is None:
        stripe_service = StripeService()
    return stripe_service