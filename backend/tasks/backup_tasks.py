import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any
from celery import current_task
from backend.celery_app import celery_app
from backend.services.backup_service import get_backup_service
from backend.database import get_database
from backend.models_billing import AuditLog

logger = logging.getLogger(__name__)

# Global backup status tracking (in production, use Redis or database)
_backup_status = {}

@celery_app.task(bind=True, name="backend.tasks.backup_tasks.create_database_backup_task")
def create_database_backup_task(self, admin_user_id: str) -> Dict[str, Any]:
    """Celery task to create database backup."""
    task_id = self.request.id
    
    try:
        # Update task status
        _backup_status[task_id] = {
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "type": "database_backup"
        }
        
        # Create backup
        backup_service = get_backup_service()
        backup_result = asyncio.run(backup_service.create_database_backup())
        
        # Log admin action
        db = asyncio.run(get_database())
        audit_log = AuditLog(
            user_id=admin_user_id,
            action="database_backup_created",
            details={"backup_file": backup_result["filename"], "task_id": task_id}
        )
        asyncio.run(db.audit_logs.insert_one(audit_log.dict()))
        
        # Update final status
        _backup_status[task_id] = {
            "status": "completed",
            "started_at": _backup_status[task_id]["started_at"],
            "completed_at": datetime.utcnow().isoformat(),
            "type": "database_backup",
            "result": backup_result
        }
        
        logger.info(f"Database backup task {task_id} completed: {backup_result['filename']}")
        return {
            "task_id": task_id,
            "status": "completed",
            "result": backup_result
        }
        
    except Exception as e:
        error_msg = f"Database backup task {task_id} failed: {str(e)}"
        logger.error(error_msg)
        
        # Update status with error
        _backup_status[task_id] = {
            "status": "failed",
            "started_at": _backup_status.get(task_id, {}).get("started_at"),
            "failed_at": datetime.utcnow().isoformat(),
            "type": "database_backup",
            "error": str(e)
        }
        
        # Log the failure
        try:
            db = asyncio.run(get_database())
            audit_log = AuditLog(
                user_id=admin_user_id,
                action="database_backup_failed",
                details={"error": str(e), "task_id": task_id}
            )
            asyncio.run(db.audit_logs.insert_one(audit_log.dict()))
        except Exception as log_error:
            logger.error(f"Failed to log backup failure: {str(log_error)}")
        
        # Re-raise to mark task as failed
        raise

@celery_app.task(bind=True, name="backend.tasks.backup_tasks.create_files_backup_task")
def create_files_backup_task(self, admin_user_id: str) -> Dict[str, Any]:
    """Celery task to create files backup."""
    task_id = self.request.id
    
    try:
        # Update task status
        _backup_status[task_id] = {
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "type": "files_backup"
        }
        
        # Create backup
        backup_service = get_backup_service()
        backup_result = asyncio.run(backup_service.create_files_backup())
        
        # Log admin action
        db = asyncio.run(get_database())
        audit_log = AuditLog(
            user_id=admin_user_id,
            action="files_backup_created",
            details={"backup_file": backup_result.get("filename", "none"), "task_id": task_id}
        )
        asyncio.run(db.audit_logs.insert_one(audit_log.dict()))
        
        # Update final status
        _backup_status[task_id] = {
            "status": "completed",
            "started_at": _backup_status[task_id]["started_at"],
            "completed_at": datetime.utcnow().isoformat(),
            "type": "files_backup",
            "result": backup_result
        }
        
        logger.info(f"Files backup task {task_id} completed: {backup_result.get('filename', 'none')}")
        return {
            "task_id": task_id,
            "status": "completed",
            "result": backup_result
        }
        
    except Exception as e:
        error_msg = f"Files backup task {task_id} failed: {str(e)}"
        logger.error(error_msg)
        
        # Update status with error
        _backup_status[task_id] = {
            "status": "failed",
            "started_at": _backup_status.get(task_id, {}).get("started_at"),
            "failed_at": datetime.utcnow().isoformat(),
            "type": "files_backup",
            "error": str(e)
        }
        
        # Log the failure
        try:
            db = asyncio.run(get_database())
            audit_log = AuditLog(
                user_id=admin_user_id,
                action="files_backup_failed",
                details={"error": str(e), "task_id": task_id}
            )
            asyncio.run(db.audit_logs.insert_one(audit_log.dict()))
        except Exception as log_error:
            logger.error(f"Failed to log files backup failure: {str(log_error)}")
        
        # Re-raise to mark task as failed
        raise

def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get the status of a backup task."""
    # Check Celery task status first
    task_result = celery_app.AsyncResult(task_id)
    
    if task_result.state == "PENDING":
        return {"status": "pending", "task_id": task_id}
    elif task_result.state == "STARTED":
        return _backup_status.get(task_id, {"status": "running", "task_id": task_id})
    elif task_result.state == "SUCCESS":
        return {
            "status": "completed",
            "task_id": task_id,
            "result": task_result.result
        }
    elif task_result.state == "FAILURE":
        return {
            "status": "failed",
            "task_id": task_id,
            "error": str(task_result.info)
        }
    else:
        return {"status": task_result.state, "task_id": task_id}

def get_all_task_statuses() -> Dict[str, Any]:
    """Get status of all backup tasks."""
    return {
        "tasks": _backup_status,
        "total_tasks": len(_backup_status),
        "running_tasks": len([t for t in _backup_status.values() if t.get("status") == "running"]),
        "completed_tasks": len([t for t in _backup_status.values() if t.get("status") == "completed"]),
        "failed_tasks": len([t for t in _backup_status.values() if t.get("status") == "failed"])
    }