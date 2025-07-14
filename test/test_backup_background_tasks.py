import os
import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from unittest.mock import AsyncMock, patch
from backend.routes.backup import _create_backup_with_logging, _create_files_backup_with_logging

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

@pytest.mark.asyncio
async def test_create_backup_with_logging_in_background():
    # Setup test DB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await db.audit_logs.delete_many({})
    
    # Patch backup service
    with patch("backend.services.backup_service.get_backup_service") as mock_service:
        mock_instance = AsyncMock()
        mock_instance.create_database_backup.return_value = {"filename": "testfile.gz"}
        mock_service.return_value = mock_instance
        
        await _create_backup_with_logging("test_admin_id")
        log = await db.audit_logs.find_one({"user_id": "test_admin_id", "action": "database_backup_created"})
        assert log is not None
        assert log["details"]["backup_file"] == "testfile.gz"
    client.close()

@pytest.mark.asyncio
async def test_create_files_backup_with_logging_in_background():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await db.audit_logs.delete_many({})
    
    with patch("backend.services.backup_service.get_backup_service") as mock_service:
        mock_instance = AsyncMock()
        mock_instance.create_files_backup.return_value = {"filename": "testfile2.gz"}
        mock_service.return_value = mock_instance
        
        await _create_files_backup_with_logging("test_admin_id")
        log = await db.audit_logs.find_one({"user_id": "test_admin_id", "action": "files_backup_created"})
        assert log is not None
        assert log["details"]["backup_file"] == "testfile2.gz"
    client.close()