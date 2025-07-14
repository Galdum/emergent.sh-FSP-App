from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict
from backend.models_billing import AuditLog
from backend.auth import get_current_user, get_current_admin_user
from backend.database import get_database
from backend.models import UserInDB
from backend.services.backup_service import get_backup_service
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/backup", tags=["backup"])

# SECURITY FIX: Removed insecure verify_admin_user function that used hardcoded email list
# Now using get_current_admin_user which properly checks the is_admin field in the database
# This prevents anyone from gaining admin access by simply registering with an admin email

async def _create_backup_with_logging(admin_user_id: str):
    """Helper function to create backup and log the action."""
    # Create a fresh DB connection
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    try:
        backup_result = await get_backup_service().create_database_backup()
        audit_log = AuditLog(
            user_id=admin_user_id,
            action="database_backup_created",
            details={"backup_file": backup_result["filename"]}
        )
        await db.audit_logs.insert_one(audit_log.dict())
        logger.info(f"Background database backup completed: {backup_result['filename']}")
    except Exception as e:
        logger.error(f"Background database backup failed: {str(e)}")
        try:
            audit_log = AuditLog(
                user_id=admin_user_id,
                action="database_backup_failed",
                details={"error": str(e)}
            )
            await db.audit_logs.insert_one(audit_log.dict())
        except Exception as log_error:
            logger.error(f"Failed to log backup failure: {str(log_error)}")
    finally:
        client.close()

async def _create_files_backup_with_logging(admin_user_id: str):
    """Helper function to create files backup and log the action."""
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    try:
        backup_result = await get_backup_service().create_files_backup()
        audit_log = AuditLog(
            user_id=admin_user_id,
            action="files_backup_created",
            details={"backup_file": backup_result.get("filename", "none")}
        )
        await db.audit_logs.insert_one(audit_log.dict())
        logger.info(f"Background files backup completed: {backup_result.get('filename', 'none')}")
    except Exception as e:
        logger.error(f"Background files backup failed: {str(e)}")
        try:
            audit_log = AuditLog(
                user_id=admin_user_id,
                action="files_backup_failed",
                details={"error": str(e)}
            )
            await db.audit_logs.insert_one(audit_log.dict())
        except Exception as log_error:
            logger.error(f"Failed to log files backup failure: {str(log_error)}")
    finally:
        client.close()

# Update background_tasks.add_task calls
@router.post("/database")
async def create_database_backup(
    background_tasks: BackgroundTasks,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    try:
        background_tasks.add_task(_create_backup_with_logging, admin_user.id)
        return {"message": "Database backup started in background", "status": "processing"}
    except Exception as e:
        logger.error(f"Failed to schedule database backup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule backup: {str(e)}"
        )

@router.post("/files")
async def create_files_backup(
    background_tasks: BackgroundTasks,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    try:
        background_tasks.add_task(_create_files_backup_with_logging, admin_user.id)
        return {"message": "Files backup started in background", "status": "processing"}
    except Exception as e:
        logger.error(f"Failed to schedule files backup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule backup: {str(e)}"
        )

@router.get("/status")
async def get_backup_status(
    admin_user: UserInDB = Depends(get_current_admin_user)
):
    """Get backup status and list of available backups."""
    
    try:
        return await get_backup_service().get_backup_status()
        
    except Exception as e:
        logger.error(f"Failed to get backup status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get backup status: {str(e)}"
        )

@router.post("/restore/{backup_filename}")
async def restore_database(
    backup_filename: str,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Restore database from backup."""
    
    try:
        restore_result = await get_backup_service().restore_database(backup_filename)
        
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
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Clean up old backup files."""
    
    try:
        cleanup_result = await get_backup_service().cleanup_old_backups(keep_days)
        
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