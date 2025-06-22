#!/usr/bin/env python3
"""
Daily backup script for Medical Licensing Guide Application
This script should be run via cron job daily
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from services.backup_service import backup_service
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/backup.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

async def main():
    """Run daily backup tasks."""
    
    try:
        logger.info("Starting daily backup process...")
        
        # Create database backup
        logger.info("Creating database backup...")
        db_backup = await backup_service.create_database_backup()
        logger.info(f"Database backup created: {db_backup['filename']}")
        
        # Create files backup
        logger.info("Creating files backup...")
        files_backup = await backup_service.create_files_backup()
        logger.info(f"Files backup created: {files_backup.get('filename', 'No files')}")
        
        # Cleanup old backups (keep 30 days)
        logger.info("Cleaning up old backups...")
        cleanup_result = await backup_service.cleanup_old_backups(30)
        logger.info(f"Cleaned up {cleanup_result['deleted_count']} old backup files")
        
        # Get backup status
        status = await backup_service.get_backup_status()
        logger.info(f"Backup status: {status['backup_count']} total backups, "
                   f"{status['total_size']} bytes total size")
        
        logger.info("Daily backup process completed successfully")
        
    except Exception as e:
        logger.error(f"Daily backup failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())