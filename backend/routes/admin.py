from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Optional
from backend.models_billing import (
    AdminUserResponse, AdminStatsResponse, AuditLog, ErrorReport,
    PaymentTransaction, SubscriptionPlan
)
from ..auth import get_current_user
from ..database import get_database
from ..models import UserInDB
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

async def verify_admin_user(current_user: UserInDB = Depends(get_current_user)):
    """Verify that the current user is an admin."""
    # For now, check if user email is in admin list (you can expand this)
    admin_emails = [
        "admin@medicalguidegermany.com",
        # Add more admin emails as needed
    ]
    
    if current_user.email not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Get admin dashboard statistics."""
    
    # Get total users
    total_users = await db.users.count_documents({})
    
    # Get active subscriptions (non-FREE and not expired)
    active_subscriptions = await db.users.count_documents({
        "subscription_tier": {"$ne": "FREE"},
        "$or": [
            {"subscription_expires": {"$gt": datetime.utcnow()}},
            {"subscription_expires": None}
        ]
    })
    
    # Get users by plan
    users_by_plan = {}
    for plan in SubscriptionPlan:
        count = await db.users.count_documents({"subscription_tier": plan.value})
        users_by_plan[plan.value] = count
    
    # Get revenue statistics
    total_revenue_cursor = db.payment_transactions.aggregate([
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ])
    total_revenue_result = await total_revenue_cursor.to_list(1)
    total_revenue = total_revenue_result[0]["total"] if total_revenue_result else 0.0
    
    # Get today's transactions and revenue
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    transactions_today = await db.payment_transactions.count_documents({
        "created_at": {"$gte": today_start}
    })
    
    revenue_today_cursor = db.payment_transactions.aggregate([
        {"$match": {
            "status": "completed",
            "created_at": {"$gte": today_start}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ])
    revenue_today_result = await revenue_today_cursor.to_list(1)
    revenue_today = revenue_today_result[0]["total"] if revenue_today_result else 0.0
    
    return AdminStatsResponse(
        total_users=total_users,
        active_subscriptions=active_subscriptions,
        total_revenue=total_revenue,
        users_by_plan=users_by_plan,
        transactions_today=transactions_today,
        revenue_today=revenue_today
    )

@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Get all users with admin details."""
    
    # Build query
    query = {}
    if search:
        query["email"] = {"$regex": search, "$options": "i"}
    
    # Get users
    users_cursor = db.users.find(query).skip(skip).limit(limit).sort("created_at", -1)
    users_data = await users_cursor.to_list(limit)
    
    admin_users = []
    for user_data in users_data:
        # Get additional stats for each user
        user_files_count = await db.personal_files.count_documents({"user_id": user_data["id"]})
        user_progress = await db.user_progress.find_one({"user_id": user_data["id"]})
        progress_steps = 0
        if user_progress:
            progress_steps = sum(len(step.get("tasks", [])) for step in user_progress.get("steps", []))
        
        admin_user_response = AdminUserResponse(
            id=user_data["id"],
            email=user_data["email"],
            subscription_tier=SubscriptionPlan(user_data.get("subscription_tier", "FREE")),
            subscription_expires=user_data.get("subscription_expires"),
            created_at=user_data["created_at"],
            is_active=user_data.get("is_active", True),
            total_files=user_files_count,
            total_progress_steps=progress_steps
        )
        admin_users.append(admin_user_response)
    
    return admin_users

@router.get("/transactions", response_model=List[PaymentTransaction])
async def get_all_transactions(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Get all payment transactions."""
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    transactions_cursor = db.payment_transactions.find(query).skip(skip).limit(limit).sort("created_at", -1)
    transactions_data = await transactions_cursor.to_list(limit)
    
    return [PaymentTransaction(**tx) for tx in transactions_data]

@router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Get audit logs."""
    
    query = {}
    if user_id:
        query["user_id"] = user_id
    if action:
        query["action"] = {"$regex": action, "$options": "i"}
    
    logs_cursor = db.audit_logs.find(query).skip(skip).limit(limit).sort("timestamp", -1)
    logs_data = await logs_cursor.to_list(limit)
    
    return [AuditLog(**log) for log in logs_data]

@router.get("/errors", response_model=List[ErrorReport])
async def get_error_reports(
    skip: int = 0,
    limit: int = 100,
    resolved: Optional[bool] = None,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Get error reports."""
    
    query = {}
    if resolved is not None:
        query["resolved"] = resolved
    
    errors_cursor = db.error_reports.find(query).skip(skip).limit(limit).sort("timestamp", -1)
    errors_data = await errors_cursor.to_list(limit)
    
    return [ErrorReport(**error) for error in errors_data]

@router.patch("/errors/{error_id}/resolve")
async def resolve_error(
    error_id: str,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Mark an error as resolved."""
    
    result = await db.error_reports.update_one(
        {"id": error_id},
        {"$set": {"resolved": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error report not found"
        )
    
    return {"message": "Error marked as resolved"}

@router.patch("/users/{user_id}/subscription")
async def update_user_subscription(
    user_id: str,
    subscription_data: Dict[str, any],
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Update a user's subscription (admin only)."""
    
    # Validate subscription tier
    if "subscription_tier" in subscription_data:
        try:
            SubscriptionPlan(subscription_data["subscription_tier"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid subscription tier"
            )
    
    update_data = {
        **subscription_data,
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Log admin action
    audit_log = AuditLog(
        user_id=admin_user.id,
        action="admin_update_user_subscription",
        details={
            "target_user_id": user_id,
            "changes": subscription_data
        }
    )
    await db.audit_logs.insert_one(audit_log.dict())
    
    return {"message": "User subscription updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Delete a user and all their data (GDPR compliance)."""
    
    # Delete user data in order
    await db.personal_files.delete_many({"user_id": user_id})
    await db.user_progress.delete_many({"user_id": user_id})
    await db.payment_transactions.delete_many({"user_id": user_id})
    
    # Delete user account
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Log admin action
    audit_log = AuditLog(
        user_id=admin_user.id,
        action="admin_delete_user",
        details={"deleted_user_id": user_id}
    )
    await db.audit_logs.insert_one(audit_log.dict())
    
    return {"message": "User deleted successfully"}