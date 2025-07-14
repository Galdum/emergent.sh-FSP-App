import os
import pytest
from unittest.mock import patch, Mock
from backend.tasks import backup_tasks
from backend.models_billing import AuditLog
from pymongo import MongoClient

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

def clear_status_and_logs():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    db.backup_task_status.delete_many({})
    db.audit_logs.delete_many({})
    client.close()

@pytest.fixture(autouse=True)
def setup_and_teardown():
    clear_status_and_logs()
    yield
    clear_status_and_logs()

def test_create_database_backup_task():
    with patch("backend.services.backup_service.get_backup_service") as mock_service:
        mock_instance = Mock()
        mock_instance.create_database_backup.return_value = {"filename": "celerytest.gz"}
        mock_service.return_value = mock_instance
        mock_task = Mock()
        mock_task.request.id = "celery-task-1"
        backup_tasks.create_database_backup_task(mock_task, "celery_admin")
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        status = db.backup_task_status.find_one({"task_id": "celery-task-1"})
        assert status is not None
        assert status["status"] == "completed"
        log = db.audit_logs.find_one({"user_id": "celery_admin", "action": "database_backup_created"})
        assert log is not None
        assert log["details"]["backup_file"] == "celerytest.gz"
        client.close()

def test_create_files_backup_task():
    with patch("backend.services.backup_service.get_backup_service") as mock_service:
        mock_instance = Mock()
        mock_instance.create_files_backup.return_value = {"filename": "celerytest2.gz"}
        mock_service.return_value = mock_instance
        mock_task = Mock()
        mock_task.request.id = "celery-task-2"
        backup_tasks.create_files_backup_task(mock_task, "celery_admin")
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        status = db.backup_task_status.find_one({"task_id": "celery-task-2"})
        assert status is not None
        assert status["status"] == "completed"
        log = db.audit_logs.find_one({"user_id": "celery_admin", "action": "files_backup_created"})
        assert log is not None
        assert log["details"]["backup_file"] == "celerytest2.gz"
        client.close()

def test_status_endpoints():
    # Insert fake statuses
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    db.backup_task_status.insert_many([
        {"task_id": "t1", "status": "completed", "type": "database_backup"},
        {"task_id": "t2", "status": "running", "type": "files_backup"}
    ])
    all_status = backup_tasks.get_all_task_statuses()
    assert all_status["total_tasks"] == 2
    assert all_status["running_tasks"] == 1
    assert all_status["completed_tasks"] == 1
    assert all_status["failed_tasks"] == 0
    single_status = backup_tasks.get_task_status("t1")
    assert single_status["status"] == "completed"
    client.close()