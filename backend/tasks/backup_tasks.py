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
from pymongo import MongoClient

logger = logging.getLogger(__name__)

def get_sync_db():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = MongoClient(mongo_url)
    return client[db_name]

def set_task_status(task_id, status_dict):
    db = get_sync_db()
    db.backup_task_status.update_one(
        {"task_id": task_id},
        {"$set": status_dict},
        upsert=True
    )

def get_task_status(task_id):
    db = get_sync_db()
    return db.backup_task_status.find_one({"task_id": task_id})

def get_all_task_statuses():
    db = get_sync_db()
    tasks = list(db.backup_task_status.find())
    return {
        "tasks": {t["task_id"]: t for t in tasks},
        "total_tasks": len(tasks),
        "running_tasks": len([t for t in tasks if t.get("status") == "running"]),
        "completed_tasks": len([t for t in tasks if t.get("status") == "completed"]),
        "failed_tasks": len([t for t in tasks if t.get("status") == "failed"])
    }

@celery_app.task(bind=True, name="backend.tasks.backup_tasks.create_database_backup_task")
def create_database_backup_task(self, admin_user_id: str) -> dict:
    task_id = self.request.id
    try:
        set_task_status(task_id, {
            "task_id": task_id,
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "type": "database_backup"
        })
        backup_service = get_backup_service()
        import asyncio
        backup_result = asyncio.run(backup_service.create_database_backup())
        db = get_sync_db()
        audit_log = AuditLog(
            user_id=admin_user_id,
            action="database_backup_created",
            details={"backup_file": backup_result["filename"], "task_id": task_id}
        )
        db.audit_logs.insert_one(audit_log.dict())
        set_task_status(task_id, {
            "task_id": task_id,
            "status": "completed",
            "started_at": get_task_status(task_id).get("started_at"),
            "completed_at": datetime.utcnow().isoformat(),
            "type": "database_backup",
            "result": backup_result
        })
        logger.info(f"Database backup task {task_id} completed: {backup_result['filename']}")
        return {
            "task_id": task_id,
            "status": "completed",
            "result": backup_result
        }
    except Exception as e:
        logger.error(f"Database backup task {task_id} failed: {str(e)}")
        set_task_status(task_id, {
            "task_id": task_id,
            "status": "failed",
            "started_at": get_task_status(task_id).get("started_at"),
            "failed_at": datetime.utcnow().isoformat(),
            "type": "database_backup",
            "error": str(e)
        })
        try:
            db = get_sync_db()
            audit_log = AuditLog(
                user_id=admin_user_id,
                action="database_backup_failed",
                details={"error": str(e), "task_id": task_id}
            )
            db.audit_logs.insert_one(audit_log.dict())
        except Exception as log_error:
            logger.error(f"Failed to log backup failure: {str(log_error)}")
        raise

@celery_app.task(bind=True, name="backend.tasks.backup_tasks.create_files_backup_task")
def create_files_backup_task(self, admin_user_id: str) -> dict:
    task_id = self.request.id
    try:
        set_task_status(task_id, {
            "task_id": task_id,
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "type": "files_backup"
        })
        backup_service = get_backup_service()
        import asyncio
        backup_result = asyncio.run(backup_service.create_files_backup())
        db = get_sync_db()
        audit_log = AuditLog(
            user_id=admin_user_id,
            action="files_backup_created",
            details={"backup_file": backup_result.get("filename", "none"), "task_id": task_id}
        )
        db.audit_logs.insert_one(audit_log.dict())
        set_task_status(task_id, {
            "task_id": task_id,
            "status": "completed",
            "started_at": get_task_status(task_id).get("started_at"),
            "completed_at": datetime.utcnow().isoformat(),
            "type": "files_backup",
            "result": backup_result
        })
        logger.info(f"Files backup task {task_id} completed: {backup_result.get('filename', 'none')}")
        return {
            "task_id": task_id,
            "status": "completed",
            "result": backup_result
        }
    except Exception as e:
        logger.error(f"Files backup task {task_id} failed: {str(e)}")
        set_task_status(task_id, {
            "task_id": task_id,
            "status": "failed",
            "started_at": get_task_status(task_id).get("started_at"),
            "failed_at": datetime.utcnow().isoformat(),
            "type": "files_backup",
            "error": str(e)
        })
        try:
            db = get_sync_db()
            audit_log = AuditLog(
                user_id=admin_user_id,
                action="files_backup_failed",
                details={"error": str(e), "task_id": task_id}
            )
            db.audit_logs.insert_one(audit_log.dict())
        except Exception as log_error:
            logger.error(f"Failed to log files backup failure: {str(log_error)}")
        raise