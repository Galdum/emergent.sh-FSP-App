from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from backend.models_billing import AuditLog
from backend.auth import get_current_user, get_current_admin_user
from backend.database import get_database
from backend.models import UserInDB
from backend.services.backup_service import get_backup_service
from backend.tasks.backup_tasks import (
    create_database_backup_task,
    create_files_backup_task,
    get_task_status,
    get_all_task_statuses
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/backup", tags=["backup"])

@router.post("/database/celery")
async def create_database_backup_celery(
    admin_user: UserInDB = Depends(get_current_admin_user)
):
    """Create a database backup using Celery task queue."""
    
    try:
        # Start Celery task
        task = create_database_backup_task.delay(admin_user.id)
        
        logger.info(f"Database backup task started: {task.id}")
        
        return {
            "message": "Database backup started in background",
            "task_id": task.id,
            "status": "processing",
            "status_endpoint": f"/backup/task/{task.id}"
        }
        
    except Exception as e:
        logger.error(f"Failed to schedule database backup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule backup: {str(e)}"
        )

@router.post("/files/celery")
async def create_files_backup_celery(
    admin_user: UserInDB = Depends(get_current_admin_user)
):
    """Create a files backup using Celery task queue."""
    
    try:
        # Start Celery task
        task = create_files_backup_task.delay(admin_user.id)
        
        logger.info(f"Files backup task started: {task.id}")
        
        return {
            "message": "Files backup started in background",
            "task_id": task.id,
            "status": "processing",
            "status_endpoint": f"/backup/task/{task.id}"
        }
        
    except Exception as e:
        logger.error(f"Failed to schedule files backup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule backup: {str(e)}"
        )

@router.get("/task/{task_id}")
async def get_backup_task_status(
    task_id: str,
    admin_user: UserInDB = Depends(get_current_admin_user)
):
    """Get the status of a specific backup task."""
    
    try:
        task_status = get_task_status(task_id)
        return task_status
        
    except Exception as e:
        logger.error(f"Failed to get task status for {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get task status: {str(e)}"
        )

@router.get("/tasks")
async def get_all_backup_tasks(
    admin_user: UserInDB = Depends(get_current_admin_user)
):
    """Get status of all backup tasks."""
    
    try:
        return get_all_task_statuses()
        
    except Exception as e:
        logger.error(f"Failed to get all task statuses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get task statuses: {str(e)}"
        )

@router.post("/database/celery/concurrent")
async def create_database_backup_celery_concurrent(
    admin_user: UserInDB = Depends(get_current_admin_user)
):
    """Create a database backup with concurrency control."""
    
    try:
        # Check if there's already a running database backup task
        all_tasks = get_all_task_statuses()
        running_db_tasks = [
            task for task in all_tasks["tasks"].values() 
            if task.get("type") == "database_backup" and task.get("status") == "running"
        ]
        
        if running_db_tasks:
            return {
                "message": "Database backup already in progress",
                "running_tasks": len(running_db_tasks),
                "status": "blocked"
            }
        
        # Start new task
        task = create_database_backup_task.delay(admin_user.id)
        
        logger.info(f"Database backup task started (concurrent check): {task.id}")
        
        return {
            "message": "Database backup started in background",
            "task_id": task.id,
            "status": "processing",
            "status_endpoint": f"/backup/task/{task.id}"
        }
        
    except Exception as e:
        logger.error(f"Failed to schedule database backup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule backup: {str(e)}"
        )

@router.post("/files/celery/concurrent")
async def create_files_backup_celery_concurrent(
    admin_user: UserInDB = Depends(get_current_admin_user)
):
    """Create a files backup with concurrency control."""
    
    try:
        # Check if there's already a running files backup task
        all_tasks = get_all_task_statuses()
        running_files_tasks = [
            task for task in all_tasks["tasks"].values() 
            if task.get("type") == "files_backup" and task.get("status") == "running"
        ]
        
        if running_files_tasks:
            return {
                "message": "Files backup already in progress",
                "running_tasks": len(running_files_tasks),
                "status": "blocked"
            }
        
        # Start new task
        task = create_files_backup_task.delay(admin_user.id)
        
        logger.info(f"Files backup task started (concurrent check): {task.id}")
        
        return {
            "message": "Files backup started in background",
            "task_id": task.id,
            "status": "processing",
            "status_endpoint": f"/backup/task/{task.id}"
        }
        
    except Exception as e:
        logger.error(f"Failed to schedule files backup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule backup: {str(e)}"
        )