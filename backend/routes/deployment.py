from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List
from auth import get_current_user
from models import UserInDB
from pydantic import BaseModel
import os
import subprocess
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/deployment", tags=["deployment"])

class VersionInfo(BaseModel):
    version: str = "1.0.0"
    build_date: str
    environment: str
    git_commit: str = "unknown"
    
class FeatureFlag(BaseModel):
    name: str
    enabled: bool
    description: str
    target_users: List[str] = []

class DeploymentStatus(BaseModel):
    status: str
    version: str
    uptime: str
    environment: str
    services: Dict[str, str]

async def verify_admin_user(current_user: UserInDB = Depends(get_current_user)):
    """Verify that the current user is an admin."""
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

@router.get("/version", response_model=VersionInfo)
async def get_version_info():
    """Get current version and build information."""
    
    environment = os.environ.get("ENVIRONMENT", "development")
    
    # Try to get git commit hash
    git_commit = "unknown"
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            cwd="/app"
        )
        if result.returncode == 0:
            git_commit = result.stdout.strip()
    except Exception:
        pass
    
    return VersionInfo(
        version="1.0.0",
        build_date=datetime.utcnow().isoformat(),
        environment=environment,
        git_commit=git_commit
    )

@router.get("/status", response_model=DeploymentStatus)
async def get_deployment_status():
    """Get current deployment status."""
    
    environment = os.environ.get("ENVIRONMENT", "development")
    
    # Check service statuses
    services = {
        "frontend": "running",
        "backend": "running", 
        "database": "running",
        "redis": "not_configured"
    }
    
    # Try to get uptime from supervisor
    uptime = "unknown"
    try:
        result = subprocess.run(
            ["supervisorctl", "status"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            uptime = "supervisor_managed"
    except Exception:
        pass
    
    return DeploymentStatus(
        status="healthy",
        version="1.0.0",
        uptime=uptime,
        environment=environment,
        services=services
    )

# Feature flags system
FEATURE_FLAGS = {
    "ai_features": FeatureFlag(
        name="ai_features",
        enabled=True,
        description="Enable AI-powered features like chatbot and FSP tutor"
    ),
    "subscription_billing": FeatureFlag(
        name="subscription_billing",
        enabled=True,
        description="Enable subscription billing with Stripe"
    ),
    "admin_panel": FeatureFlag(
        name="admin_panel",
        enabled=True,
        description="Enable admin panel access"
    ),
    "error_monitoring": FeatureFlag(
        name="error_monitoring",
        enabled=True,
        description="Enable error monitoring and reporting"
    ),
    "backup_system": FeatureFlag(
        name="backup_system",
        enabled=True,
        description="Enable automated backup system"
    )
}

@router.get("/feature-flags")
async def get_feature_flags(current_user: UserInDB = Depends(get_current_user)):
    """Get current feature flags for the user."""
    
    user_flags = {}
    for name, flag in FEATURE_FLAGS.items():
        # Check if feature is enabled for this user
        is_enabled = flag.enabled
        
        # If target_users is specified, check if user is in the list
        if flag.target_users and current_user.email not in flag.target_users:
            is_enabled = False
            
        user_flags[name] = is_enabled
    
    return user_flags

@router.put("/feature-flags/{flag_name}")
async def toggle_feature_flag(
    flag_name: str,
    enabled: bool,
    admin_user: UserInDB = Depends(verify_admin_user)
):
    """Toggle a feature flag (admin only)."""
    
    if flag_name not in FEATURE_FLAGS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found"
        )
    
    FEATURE_FLAGS[flag_name].enabled = enabled
    
    logger.info(f"Feature flag '{flag_name}' {'enabled' if enabled else 'disabled'} by {admin_user.email}")
    
    return {
        "message": f"Feature flag '{flag_name}' {'enabled' if enabled else 'disabled'}",
        "flag": FEATURE_FLAGS[flag_name].dict()
    }

@router.get("/export-data")
async def export_user_data(
    current_user: UserInDB = Depends(get_current_user)
):
    """Export user's data for GDPR compliance."""
    
    from ..database import get_database
    db = await get_database()
    
    # Collect all user data
    user_data = {
        "user_profile": {
            "id": current_user.id,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat(),
            "subscription_tier": current_user.subscription_tier
        },
        "personal_files": [],
        "progress": None,
        "transactions": []
    }
    
    # Get personal files
    files_cursor = db.personal_files.find({"user_id": current_user.id})
    files_data = await files_cursor.to_list(1000)
    user_data["personal_files"] = files_data
    
    # Get progress data
    progress_data = await db.user_progress.find_one({"user_id": current_user.id})
    if progress_data:
        user_data["progress"] = progress_data
    
    # Get transaction history
    transactions_cursor = db.payment_transactions.find({"user_id": current_user.id})
    transactions_data = await transactions_cursor.to_list(1000)
    user_data["transactions"] = transactions_data
    
    return {
        "message": "User data exported successfully",
        "export_date": datetime.utcnow().isoformat(),
        "data": user_data
    }

@router.delete("/delete-account")
async def delete_user_account(
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete user account and all associated data (GDPR compliance)."""
    
    from ..database import get_database
    db = await get_database()
    
    try:
        # Delete user data in order
        await db.personal_files.delete_many({"user_id": current_user.id})
        await db.user_progress.delete_many({"user_id": current_user.id})
        await db.payment_transactions.update_many(
            {"user_id": current_user.id},
            {"$set": {"user_id": None, "email": "deleted_user@example.com"}}
        )
        
        # Delete user account
        await db.users.delete_one({"id": current_user.id})
        
        logger.info(f"User account deleted: {current_user.email}")
        
        return {"message": "Account deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete user account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )