import os
import asyncio
import subprocess
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class BackupService:
    def __init__(self):
        # Use environment variable or fall back to local directory
        backup_path = os.environ.get("BACKUP_DIR", "/workspace/backups")
        self.backup_dir = Path(backup_path)
        try:
            self.backup_dir.mkdir(exist_ok=True, parents=True)
            self._initialized = True
        except PermissionError:
            logger.warning(f"Cannot create backup directory at {backup_path} - backup functionality disabled")
            self._initialized = False
        
        # AWS S3 configuration (optional for offsite backups)
        self.s3_bucket = os.environ.get("BACKUP_S3_BUCKET")
        self.aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
        self.aws_region = os.environ.get("AWS_REGION", "us-east-1")
        
        if self.s3_bucket and self.aws_access_key:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=self.aws_access_key,
                    aws_secret_access_key=self.aws_secret_key,
                    region_name=self.aws_region
                )
                logger.info("S3 backup configured successfully")
            except Exception as e:
                logger.error(f"Failed to configure S3 client: {str(e)}")
                self.s3_client = None
        else:
            self.s3_client = None
            logger.info("S3 backup not configured - using local backups only")
    
    def _check_initialized(self):
        if not self._initialized:
            raise ValueError("Backup service not initialized - cannot create backup directory")
    
    async def create_database_backup(self) -> Dict[str, str]:
        """Create a MongoDB database backup."""
        self._check_initialized()
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"mongodb_backup_{timestamp}.gz"
        backup_path = self.backup_dir / backup_filename
        
        try:
            # MongoDB connection details
            mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
            db_name = os.environ.get("DB_NAME", "test_database")
            
            # Create mongodump command
            cmd = [
                "mongodump",
                "--uri", mongo_url,
                "--db", db_name,
                "--gzip",
                "--archive", str(backup_path)
            ]
            
            # Run the backup
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"Backup failed: {stderr.decode()}")
            
            backup_size = backup_path.stat().st_size
            logger.info(f"Database backup created: {backup_filename} ({backup_size} bytes)")
            
            # Upload to S3 if configured
            s3_url = None
            if self.s3_client:
                s3_url = await self._upload_to_s3(backup_path, backup_filename)
            
            return {
                "filename": backup_filename,
                "local_path": str(backup_path),
                "size": backup_size,
                "s3_url": s3_url,
                "timestamp": timestamp
            }
            
        except Exception as e:
            logger.error(f"Database backup failed: {str(e)}")
            raise
    
    async def create_files_backup(self) -> Dict[str, str]:
        """Create a backup of uploaded files."""
        self._check_initialized()
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"files_backup_{timestamp}.tar.gz"
        backup_path = self.backup_dir / backup_filename
        
        try:
            files_dir = Path("/app/uploads")
            if not files_dir.exists():
                logger.warning("Uploads directory does not exist")
                return {"message": "No files to backup"}
            
            # Create tar.gz archive of uploads directory
            cmd = [
                "tar", "-czf", str(backup_path), 
                "-C", str(files_dir.parent), 
                files_dir.name
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"Files backup failed: {stderr.decode()}")
            
            backup_size = backup_path.stat().st_size
            logger.info(f"Files backup created: {backup_filename} ({backup_size} bytes)")
            
            # Upload to S3 if configured
            s3_url = None
            if self.s3_client:
                s3_url = await self._upload_to_s3(backup_path, backup_filename)
            
            return {
                "filename": backup_filename,
                "local_path": str(backup_path),
                "size": backup_size,
                "s3_url": s3_url,
                "timestamp": timestamp
            }
            
        except Exception as e:
            logger.error(f"Files backup failed: {str(e)}")
            raise
    
    async def _upload_to_s3(self, file_path: Path, filename: str) -> str:
        """Upload backup file to S3."""
        
        try:
            s3_key = f"backups/{filename}"
            
            # Upload in a separate thread to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                self.s3_client.upload_file,
                str(file_path),
                self.s3_bucket,
                s3_key
            )
            
            s3_url = f"s3://{self.s3_bucket}/{s3_key}"
            logger.info(f"Backup uploaded to S3: {s3_url}")
            return s3_url
            
        except ClientError as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            return None
    
    async def cleanup_old_backups(self, keep_days: int = 30):
        """Clean up old backup files."""
        self._check_initialized()
        
        cutoff_date = datetime.utcnow() - timedelta(days=keep_days)
        
        try:
            deleted_count = 0
            for backup_file in self.backup_dir.glob("*_backup_*.gz"):
                if backup_file.stat().st_mtime < cutoff_date.timestamp():
                    backup_file.unlink()
                    deleted_count += 1
                    logger.info(f"Deleted old backup: {backup_file.name}")
            
            logger.info(f"Cleaned up {deleted_count} old backup files")
            return {"deleted_count": deleted_count}
            
        except Exception as e:
            logger.error(f"Backup cleanup failed: {str(e)}")
            raise
    
    async def restore_database(self, backup_filename: str) -> Dict[str, str]:
        """Restore database from backup."""
        self._check_initialized()
        
        backup_path = self.backup_dir / backup_filename
        
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_filename}")
        
        try:
            # MongoDB connection details
            mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
            db_name = os.environ.get("DB_NAME", "test_database")
            
            # Create mongorestore command
            cmd = [
                "mongorestore",
                "--uri", mongo_url,
                "--db", db_name,
                "--gzip",
                "--archive", str(backup_path),
                "--drop"  # Drop existing collections before restore
            ]
            
            # Run the restore
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"Restore failed: {stderr.decode()}")
            
            logger.info(f"Database restored from: {backup_filename}")
            
            return {
                "message": "Database restored successfully",
                "backup_file": backup_filename,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Database restore failed: {str(e)}")
            raise
    
    async def get_backup_status(self) -> Dict[str, Any]:
        """Get current backup status and statistics."""
        self._check_initialized()
        
        try:
            backups = []
            total_size = 0
            
            for backup_file in sorted(self.backup_dir.glob("*_backup_*.gz"), reverse=True):
                stat = backup_file.stat()
                backups.append({
                    "filename": backup_file.name,
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
                total_size += stat.st_size
            
            return {
                "backup_count": len(backups),
                "total_size": total_size,
                "latest_backup": backups[0] if backups else None,
                "s3_configured": self.s3_client is not None,
                "backups": backups[:10]  # Last 10 backups
            }
            
        except Exception as e:
            logger.error(f"Failed to get backup status: {str(e)}")
            raise

# Global service instance - initialize conditionally  
backup_service = None

def get_backup_service():
    global backup_service
    if backup_service is None:
        backup_service = BackupService()
    return backup_service