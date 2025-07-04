from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Optional, Any
from backend.models_billing import (
    AdminUserResponse, AdminStatsResponse, AuditLog, ErrorReport,
    PaymentTransaction, SubscriptionPlan
)
from backend.auth import get_current_user, get_current_admin_user
from backend.database import get_database
from backend.models import UserInDB
from backend.security import sanitize_regex_pattern, AuditLogger
from datetime import datetime, timedelta
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

# Add new import for the UtilInfoDocument model
from backend.models import UtilInfoDocument

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin_user: UserInDB = Depends(get_current_admin_user),
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
    
    # Log admin access
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_view_stats",
        details={"view": "dashboard_stats"}
    )
    
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
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get all users with admin details."""
    
    # Limit max results
    limit = min(limit, 100)
    
    # Build query with sanitized search
    query = {}
    if search:
        # Sanitize search pattern to prevent ReDoS
        sanitized_search = sanitize_regex_pattern(search)
        query["email"] = {"$regex": sanitized_search, "$options": "i"}
    
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
            is_admin=user_data.get("is_admin", False),
            total_files=user_files_count,
            total_progress_steps=progress_steps
        )
        admin_users.append(admin_user_response)
    
    # Log admin access
    audit_logger = AuditLogger(db)
    await audit_logger.log_data_access(
        user_id=admin_user.id,
        data_type="user_list",
        operation="list"
    )
    
    return admin_users

@router.get("/transactions", response_model=List[PaymentTransaction])
async def get_all_transactions(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get all payment transactions."""
    
    # Limit max results
    limit = min(limit, 100)
    
    query = {}
    if status_filter and status_filter in ["pending", "completed", "failed", "refunded"]:
        query["status"] = status_filter
    
    transactions_cursor = db.payment_transactions.find(query).skip(skip).limit(limit).sort("created_at", -1)
    transactions_data = await transactions_cursor.to_list(limit)
    
    # Log admin access
    audit_logger = AuditLogger(db)
    await audit_logger.log_data_access(
        user_id=admin_user.id,
        data_type="payment_transactions",
        operation="list"
    )
    
    return [PaymentTransaction(**tx) for tx in transactions_data]

@router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get audit logs."""
    
    # Limit max results
    limit = min(limit, 100)
    
    query = {}
    if user_id:
        query["user_id"] = user_id
    if action:
        # Sanitize action pattern
        sanitized_action = sanitize_regex_pattern(action)
        query["action"] = {"$regex": sanitized_action, "$options": "i"}
    
    logs_cursor = db.audit_logs.find(query).skip(skip).limit(limit).sort("timestamp", -1)
    logs_data = await logs_cursor.to_list(limit)
    
    return [AuditLog(**log) for log in logs_data]

@router.get("/errors", response_model=List[ErrorReport])
async def get_error_reports(
    skip: int = 0,
    limit: int = 100,
    resolved: Optional[bool] = None,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get error reports."""
    
    # Limit max results
    limit = min(limit, 100)
    
    query = {}
    if resolved is not None:
        query["resolved"] = resolved
    
    errors_cursor = db.error_reports.find(query).skip(skip).limit(limit).sort("timestamp", -1)
    errors_data = await errors_cursor.to_list(limit)
    
    return [ErrorReport(**error) for error in errors_data]

@router.patch("/errors/{error_id}/resolve")
async def resolve_error(
    error_id: str,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Mark an error as resolved."""
    
    result = await db.error_reports.update_one(
        {"id": error_id},
        {"$set": {"resolved": True, "resolved_by": admin_user.id, "resolved_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error report not found"
        )
    
    # Log admin action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_resolve_error",
        details={"error_id": error_id}
    )
    
    return {"message": "Error marked as resolved"}

@router.patch("/users/{user_id}/subscription")
async def update_user_subscription(
    user_id: str,
    subscription_data: Dict[str, str],
    request: Request,
    admin_user: UserInDB = Depends(get_current_admin_user),
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
    
    # Check if user exists
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = {
        **subscription_data,
        "updated_at": datetime.utcnow(),
        "updated_by": admin_user.id
    }
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    # Log admin action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_update_user_subscription",
        details={
            "target_user_id": user_id,
            "changes": subscription_data
        },
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "User subscription updated successfully"}

@router.patch("/users/{user_id}/admin-status")
async def update_user_admin_status(
    user_id: str,
    is_admin: bool,
    request: Request,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Grant or revoke admin privileges for a user."""
    
    # Prevent self-demotion
    if user_id == admin_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin privileges"
        )
    
    # Check if user exists
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update admin status
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "is_admin": is_admin,
            "admin_granted_by": admin_user.id if is_admin else None,
            "admin_granted_at": datetime.utcnow() if is_admin else None,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Log admin action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_update_user_admin_status",
        details={
            "target_user_id": user_id,
            "is_admin": is_admin,
            "target_email": target_user.get("email")
        },
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"Admin status {'granted' if is_admin else 'revoked'} successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    request: Request,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Delete a user and all their data (GDPR compliance)."""
    
    # Prevent self-deletion
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Check if user exists
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete user data in order
    collections_to_clean = [
        "personal_files",
        "user_progress",
        "documents",
        "fsp_progress",
        "payment_transactions",
        "subscriptions",
        "gdpr_consents",
        "privacy_settings"
    ]
    
    for collection in collections_to_clean:
        await db[collection].delete_many({"user_id": user_id})
    
    # Delete user account
    result = await db.users.delete_one({"id": user_id})
    
    # Log admin action (keep audit logs for compliance)
    audit_logger = AuditLogger(db)
    await audit_logger.log_privacy_action(
        user_id=admin_user.id,
        action="admin_delete_user",
        details={
            "deleted_user_id": user_id,
            "deleted_user_email": target_user.get("email"),
            "reason": "Admin action"
        },
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "User deleted successfully"}

@router.post("/initialize-admin")
async def initialize_admin(
    request: Request,
    db = Depends(get_database)
):
    """
    Initialize the first admin user if no admins exist.
    This endpoint can only be used when there are no admin users in the system.
    """
    # Check if any admin users exist
    admin_count = await db.users.count_documents({"is_admin": True})
    
    if admin_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin users already exist"
        )
    
    # Get the admin email and password from environment
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    
    if not admin_email or not admin_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin credentials not configured"
        )
    
    # Check if user with this email already exists
    existing_user = await db.users.find_one({"email": admin_email.lower()})
    
    if existing_user:
        # Make existing user an admin
        await db.users.update_one(
            {"email": admin_email.lower()},
            {"$set": {
                "is_admin": True,
                "admin_granted_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        user_id = existing_user["id"]
    else:
        # Create new admin user
        from backend.auth import get_password_hash
        from backend.models import User, UserInDB
        
        user = User(email=admin_email.lower())
        user_in_db = UserInDB(
            **user.dict(),
            password_hash=get_password_hash(admin_password),
            is_admin=True,
            admin_granted_at=datetime.utcnow()
        )
        
        await db.users.insert_one(user_in_db.dict())
        user_id = user.id
    
    # Log the initialization
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=user_id,
        action="admin_initialized",
        details={"method": "environment_variables"},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Admin user initialized successfully"}

@router.get("/util-info-docs")
async def get_util_info_docs(
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get all utility information documents for admin management."""
    
    docs_cursor = db.util_info_documents.find({}).sort("order_priority", 1)
    docs_data = await docs_cursor.to_list(None)
    
    # Log admin access
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_view_util_info_docs",
        details={"count": len(docs_data)}
    )
    
    return [UtilInfoDocument(**doc) for doc in docs_data]

@router.post("/util-info-docs")
async def create_util_info_doc(
    doc_data: Dict[str, Any],
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Create a new utility information document."""
    
    # Validate required fields
    required_fields = ["title", "category", "content_type"]
    for field in required_fields:
        if field not in doc_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required field: {field}"
            )
    
    # Create document
    util_doc = UtilInfoDocument(
        **doc_data,
        created_by=admin_user.id
    )
    
    await db.util_info_documents.insert_one(util_doc.dict())
    
    # Log admin action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_create_util_info_doc",
        details={"doc_id": util_doc.id, "title": util_doc.title}
    )
    
    return util_doc

@router.put("/util-info-docs/{doc_id}")
async def update_util_info_doc(
    doc_id: str,
    doc_data: Dict[str, Any],
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Update an existing utility information document."""
    
    # Check if document exists
    existing_doc = await db.util_info_documents.find_one({"id": doc_id})
    if not existing_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Update document
    update_data = {
        **doc_data,
        "updated_by": admin_user.id,
        "updated_at": datetime.utcnow()
    }
    
    result = await db.util_info_documents.update_one(
        {"id": doc_id},
        {"$set": update_data}
    )
    
    # Log admin action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_update_util_info_doc",
        details={"doc_id": doc_id, "changes": list(doc_data.keys())}
    )
    
    return {"message": "Document updated successfully"}

@router.delete("/util-info-docs/{doc_id}")
async def delete_util_info_doc(
    doc_id: str,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Delete a utility information document."""
    
    # Check if document exists
    existing_doc = await db.util_info_documents.find_one({"id": doc_id})
    if not existing_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete document
    result = await db.util_info_documents.delete_one({"id": doc_id})
    
    # If document had an associated file, optionally delete it too
    if existing_doc.get("file_id"):
        await db.personal_files.delete_one({"id": existing_doc["file_id"]})
    
    # Log admin action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_delete_util_info_doc",
        details={"doc_id": doc_id, "title": existing_doc.get("title")}
    )
    
    return {"message": "Document deleted successfully"}

@router.patch("/util-info-docs/{doc_id}/reorder")
async def reorder_util_info_doc(
    doc_id: str,
    new_order: int,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Update the order priority of a utility information document."""
    
    result = await db.util_info_documents.update_one(
        {"id": doc_id},
        {
            "$set": {
                "order_priority": new_order,
                "updated_by": admin_user.id,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Log admin action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=admin_user.id,
        action="admin_reorder_util_info_doc",
        details={"doc_id": doc_id, "new_order": new_order}
    )
    
    return {"message": "Document order updated successfully"}