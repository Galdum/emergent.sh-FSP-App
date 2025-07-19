"""
File upload service with Cloudflare R2 support and local fallback
Handles file uploads for forum attachments with proper validation and storage
"""

import os
import boto3
import hashlib
import mimetypes
from typing import Optional
from pathlib import Path
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class UploadService:
    def __init__(self):
        # Cloudflare R2 configuration
        self.r2_endpoint = os.getenv('R2_ENDPOINT')
        self.r2_bucket = os.getenv('R2_BUCKET') 
        self.r2_access_key = os.getenv('R2_ACCESS_KEY')
        self.r2_secret_key = os.getenv('R2_SECRET_KEY')
        
        # Local fallback configuration
        self.local_upload_dir = os.getenv('UPLOAD_DIR', '/app/uploads')
        
        # Initialize R2 client if credentials are available
        self.r2_client = None
        if all([self.r2_endpoint, self.r2_bucket, self.r2_access_key, self.r2_secret_key]):
            try:
                self.r2_client = boto3.client(
                    's3',
                    endpoint_url=self.r2_endpoint,
                    aws_access_key_id=self.r2_access_key,
                    aws_secret_access_key=self.r2_secret_key,
                    region_name='auto'  # Cloudflare R2 uses 'auto'
                )
                logger.info("Cloudflare R2 client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize R2 client: {e}. Falling back to local storage.")
                self.r2_client = None
        else:
            logger.info("R2 credentials not provided. Using local storage.")
        
        # Ensure local upload directory exists
        Path(self.local_upload_dir).mkdir(parents=True, exist_ok=True)
    
    def _generate_file_key(self, filename: str, content: bytes) -> str:
        """Generate a unique file key based on content hash and timestamp"""
        file_hash = hashlib.md5(content).hexdigest()[:8]
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        
        # Get file extension
        ext = Path(filename).suffix.lower()
        
        return f"forum/{timestamp}_{file_hash}{ext}"
    
    async def upload_file(self, content: bytes, filename: str, content_type: str) -> str:
        """
        Upload file to R2 or local storage
        Returns the URL to access the uploaded file
        """
        try:
            file_key = self._generate_file_key(filename, content)
            
            # Try R2 upload first if available
            if self.r2_client:
                try:
                    self.r2_client.put_object(
                        Bucket=self.r2_bucket,
                        Key=file_key,
                        Body=content,
                        ContentType=content_type,
                        # Make file publicly readable
                        ACL='public-read'
                    )
                    
                    # Return R2 URL
                    file_url = f"{self.r2_endpoint}/{self.r2_bucket}/{file_key}"
                    logger.info(f"File uploaded to R2: {file_url}")
                    return file_url
                except Exception as e:
                    logger.error(f"R2 upload failed: {e}. Falling back to local storage.")
            
            # Fallback to local storage
            local_path = Path(self.local_upload_dir) / file_key
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(content)
            
            # Return local URL (relative to uploads directory)
            file_url = f"/uploads/{file_key}"
            logger.info(f"File uploaded locally: {file_url}")
            return file_url
            
        except Exception as e:
            logger.error(f"File upload failed: {e}")
            raise Exception(f"Upload failed: {str(e)}")
    
    def is_allowed_file_type(self, filename: str, content_type: str) -> bool:
        """Check if file type is allowed"""
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.md'}
        allowed_mimes = {
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'text/markdown'
        }
        
        ext = Path(filename).suffix.lower()
        return ext in allowed_extensions and content_type in allowed_mimes
    
    def validate_file_size(self, content: bytes, content_type: str) -> bool:
        """Validate file size based on type"""
        size = len(content)
        
        # 5MB limit for images, 10MB for other files
        if content_type.startswith('image/'):
            return size <= 5 * 1024 * 1024  # 5MB
        else:
            return size <= 10 * 1024 * 1024  # 10MB

# Global upload service instance
upload_service = UploadService()

async def upload_file(content: bytes, filename: str, content_type: str) -> str:
    """
    Convenience function for uploading files
    """
    # Validate file type
    if not upload_service.is_allowed_file_type(filename, content_type):
        raise ValueError("File type not allowed")
    
    # Validate file size
    if not upload_service.validate_file_size(content, content_type):
        raise ValueError("File too large")
    
    return await upload_service.upload_file(content, filename, content_type)