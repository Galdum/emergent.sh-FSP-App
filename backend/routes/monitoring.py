from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Optional
from backend.models_billing import ErrorReport, AuditLog
from backend.auth import get_current_user
from backend.database import get_database
from backend.models import UserInDB
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/monitoring", tags=["monitoring"])

class ErrorReportCreate(BaseModel):
    error_type: str
    error_message: str
    stack_trace: Optional[str] = None
    url: Optional[str] = None
    additional_data: Optional[Dict] = None

class UserFeedback(BaseModel):
    message: str
    category: str = "general"  # general, bug, feature_request, etc.
    priority: str = "medium"   # low, medium, high
    additional_data: Optional[Dict] = None

@router.post("/report-error")
async def report_error(
    request: Request,
    error_data: ErrorReportCreate,
    current_user: Optional[UserInDB] = Depends(get_current_user),
    db = Depends(get_database)
):
    """Report an application error."""
    
    error_report = ErrorReport(
        user_id=current_user.id if current_user else None,
        error_type=error_data.error_type,
        error_message=error_data.error_message,
        stack_trace=error_data.stack_trace,
        url=error_data.url,
        user_agent=request.headers.get("user-agent")
    )
    
    await db.error_reports.insert_one(error_report.dict())
    logger.error(f"Error reported: {error_data.error_type} - {error_data.error_message}")
    
    return {"message": "Error reported successfully", "report_id": error_report.id}

@router.post("/feedback")
async def submit_feedback(
    request: Request,
    feedback_data: UserFeedback,
    current_user: Optional[UserInDB] = Depends(get_current_user),
    db = Depends(get_database)
):
    """Submit user feedback."""
    
    # Store feedback as an audit log entry
    audit_log = AuditLog(
        user_id=current_user.id if current_user else None,
        action="user_feedback",
        details={
            "message": feedback_data.message,
            "category": feedback_data.category,
            "priority": feedback_data.priority,
            "additional_data": feedback_data.additional_data or {}
        },
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    await db.audit_logs.insert_one(audit_log.dict())
    logger.info(f"User feedback received: {feedback_data.category} - {feedback_data.message[:100]}")
    
    return {"message": "Feedback submitted successfully", "feedback_id": audit_log.id}

@router.get("/health")
async def health_check(db = Depends(get_database)):
    """Application health check endpoint."""
    
    try:
        # Check database connection
        await db.users.count_documents({}, limit=1)
        
        # Check key services
        services_status = {
            "database": "healthy",
            "api": "healthy",
            "timestamp": "datetime.utcnow().isoformat()"
        }
        
        return {
            "status": "healthy",
            "services": services_status,
            "version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "datetime.utcnow().isoformat()"
        }

@router.get("/metrics")
async def get_metrics(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get application metrics (for authenticated users)."""
    
    # Basic metrics that users can see
    user_metrics = {
        "user_id": current_user.id,
        "subscription_tier": current_user.subscription_tier,
        "account_created": current_user.created_at.isoformat(),
        "files_count": await db.personal_files.count_documents({"user_id": current_user.id}),
        "last_login": "datetime.utcnow().isoformat()"  # You can track this separately
    }
    
    return user_metrics

@router.post("/log-action")
async def log_user_action(
    request: Request,
    action_data: Dict,
    current_user: Optional[UserInDB] = Depends(get_current_user),
    db = Depends(get_database)
):
    """Log user actions for analytics and audit."""
    
    audit_log = AuditLog(
        user_id=current_user.id if current_user else None,
        action=action_data.get("action", "unknown"),
        details=action_data.get("details", {}),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    await db.audit_logs.insert_one(audit_log.dict())
    
    return {"message": "Action logged successfully"}

# Endpoint for frontend to poll for user notifications
@router.get("/notifications")
async def get_user_notifications(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user notifications and announcements."""
    
    # Check for subscription expiry warnings
    notifications = []
    
    if (current_user.subscription_tier != "FREE" and 
        current_user.subscription_expires and 
        current_user.subscription_expires < "datetime.utcnow() + timedelta(days=7)"):
        notifications.append({
            "type": "warning",
            "title": "Subscription Expiring Soon",
            "message": f"Your {current_user.subscription_tier} subscription expires on {current_user.subscription_expires.strftime('%B %d, %Y')}",
            "action_url": "/subscription"
        })
    
    # Add more notification types as needed
    
    return {"notifications": notifications}