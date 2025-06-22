from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict
from backend.models_billing import AuditLog
from backend.auth import get_current_user
from backend.database import get_database
from backend.models import UserInDB
from backend.services.backup_service import backup_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/backup", tags=["backup"])

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

@router.post("/database")
async def create_database_backup(
    background_tasks: BackgroundTasks,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Create a database backup."""
    
    try:
        # Create backup in background
        backup_result = await backup_service.create_database_backup()
        
        # Log admin action
        audit_log = AuditLog(
            user_id=admin_user.id,
            action="database_backup_created",
            details={"backup_file": backup_result["filename"]}
        )
        await db.audit_logs.insert_one(audit_log.dict())
        
        return backup_result
        
    except Exception as e:
        logger.error(f"Database backup failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup failed: {str(e)}"
        )

@router.post("/files")
async def create_files_backup(
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Create a files backup."""
    
    try:
        backup_result = await backup_service.create_files_backup()
        
        # Log admin action
        audit_log = AuditLog(
            user_id=admin_user.id,
            action="files_backup_created",
            details={"backup_file": backup_result.get("filename", "none")}
        )
        await db.audit_logs.insert_one(audit_log.dict())
        
        return backup_result
        
    except Exception as e:
        logger.error(f"Files backup failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup failed: {str(e)}"
        )

@router.get("/status")
async def get_backup_status(
    admin_user: UserInDB = Depends(verify_admin_user)
):
    """Get backup status and list of available backups."""
    
    try:
        return await backup_service.get_backup_status()
        
    except Exception as e:
        logger.error(f"Failed to get backup status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get backup status: {str(e)}"
        )

@router.post("/restore/{backup_filename}")
async def restore_database(
    backup_filename: str,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Restore database from backup."""
    
    try:
        restore_result = await backup_service.restore_database(backup_filename)
        
        # Log admin action
        audit_log = AuditLog(
            user_id=admin_user.id,
            action="database_restored",
            details={"backup_file": backup_filename}
        )
        await db.audit_logs.insert_one(audit_log.dict())
        
        return restore_result
        
    except Exception as e:
        logger.error(f"Database restore failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Restore failed: {str(e)}"
        )

@router.post("/cleanup")
async def cleanup_old_backups(
    keep_days: int = 30,
    admin_user: UserInDB = Depends(verify_admin_user),
    db = Depends(get_database)
):
    """Clean up old backup files."""
    
    try:
        cleanup_result = await backup_service.cleanup_old_backups(keep_days)
        
        # Log admin action
        audit_log = AuditLog(
            user_id=admin_user.id,
            action="backup_cleanup",
            details={"deleted_count": cleanup_result["deleted_count"], "keep_days": keep_days}
        )
        await db.audit_logs.insert_one(audit_log.dict())
        
        return cleanup_result
        
    except Exception as e:
        logger.error(f"Backup cleanup failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleanup failed: {str(e)}"
        )