from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from typing import List
from backend.models import PersonalFileCreate, PersonalFileResponse, MessageResponse, PersonalFile
from backend.auth import get_current_user
from backend.database import get_database
from backend.models import UserInDB
from backend.security import (
    sanitize_filename, validate_file_type, check_file_size, 
    get_allowed_file_types, AuditLogger, safe_rate_limit
)
import os
import uuid
from pathlib import Path
import aiofiles
import hashlib
import logging

# Import badge awarding functionality
from backend.routes.badges import check_and_award_badges

router = APIRouter(prefix="/files", tags=["personal_files"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(os.environ.get('UPLOAD_DIR', '/app/uploads'))
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

async def scan_file_for_malware(file_path: Path) -> bool:
    """
    Placeholder for malware scanning.
    In production, integrate with ClamAV or similar service.
    """
    # TODO: Implement actual virus scanning
    # For now, just check if file is readable
    try:
        async with aiofiles.open(file_path, 'rb') as f:
            await f.read(1024)  # Read first KB
        return True
    except Exception:
        return False

async def calculate_file_hash(file_path: Path) -> str:
    """Calculate SHA256 hash of file for integrity checking."""
    sha256_hash = hashlib.sha256()
    async with aiofiles.open(file_path, "rb") as f:
        while chunk := await f.read(8192):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()

@router.get("/", response_model=List[PersonalFileResponse])
async def get_personal_files(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database),
    skip: int = 0,
    limit: int = 100
):
    """Get user's personal files with pagination."""
    # Limit maximum files per request
    limit = min(limit, 100)
    
    files_cursor = db.personal_files.find({"user_id": current_user.id})
    files_cursor = files_cursor.skip(skip).limit(limit)
    files_data = await files_cursor.to_list(limit)
    
    # Log data access
    audit_logger = AuditLogger(db)
    await audit_logger.log_data_access(
        user_id=current_user.id,
        data_type="personal_files",
        operation="list"
    )
    
    return [PersonalFileResponse(**file_data) for file_data in files_data]

@router.post("/", response_model=PersonalFileResponse)
async def create_personal_file(
    file_data: PersonalFileCreate,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new personal file (note or link)."""
    # Validate input
    if file_data.type not in ["note", "link"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be 'note' or 'link'"
        )
    
    if file_data.type == "link" and not file_data.url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required for link type"
        )
    
    personal_file = PersonalFile(
        **file_data.dict(),
        user_id=current_user.id
    )
    
    await db.personal_files.insert_one(personal_file.dict())
    
    # Log action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="create_personal_file",
        details={"file_id": personal_file.id, "type": file_data.type}
    )
    
    return PersonalFileResponse(**personal_file.dict())

@router.post("/upload", response_model=PersonalFileResponse)
@safe_rate_limit("20 per hour")  # Rate limit for file uploads
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Upload a file with security validations."""
    # Sanitize filename
    original_filename = sanitize_filename(file.filename)
    
    # Validate file type
    allowed_types = get_allowed_file_types()
    if not validate_file_type(original_filename, allowed_types):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Check file size
    file_content = await file.read()
    if not check_file_size(len(file_content)):
        max_size = os.environ.get('MAX_FILE_SIZE_MB', 10)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {max_size}MB"
        )
    
    # Generate unique filename with user namespace
    file_extension = os.path.splitext(original_filename)[1]
    unique_filename = f"{current_user.id}/{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Create user directory if it doesn't exist
    file_path.parent.mkdir(exist_ok=True, parents=True)
    
    # Save file to disk
    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file"
        )
    
    # Scan for malware
    if not await scan_file_for_malware(file_path):
        # Remove suspicious file
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File failed security scan"
        )
    
    # Calculate file hash for integrity
    file_hash = await calculate_file_hash(file_path)
    
    # Create database record
    personal_file = PersonalFile(
        type="file",
        title=original_filename,
        user_id=current_user.id,
        file_path=str(unique_filename),  # Store relative path only
        file_size=len(file_content),
        file_hash=file_hash,
        mime_type=file.content_type
    )
    
    await db.personal_files.insert_one(personal_file.dict())
    
    # Log file upload
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="upload_file",
        details={
            "file_id": personal_file.id,
            "filename": original_filename,
            "size": len(file_content),
            "type": file.content_type
        },
        ip_address=request.client.host if request.client else None
    )
    
    # Check and award badges for file upload
    try:
        await check_and_award_badges(db, current_user.id)
    except Exception as e:
        logger.warning(f"Failed to check badges after file upload: {e}")
    
    return PersonalFileResponse(**personal_file.dict())

@router.put("/{file_id}", response_model=PersonalFileResponse)
async def update_personal_file(
    file_id: str,
    file_data: PersonalFileCreate,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a personal file."""
    # Validate file_id format
    try:
        uuid.UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file ID format"
        )
    
    # Check if file exists and belongs to user
    existing_file = await db.personal_files.find_one({
        "id": file_id,
        "user_id": current_user.id
    })
    
    if not existing_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Update file
    update_data = file_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.personal_files.update_one(
        {"id": file_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated file
    updated_file = await db.personal_files.find_one({
        "id": file_id,
        "user_id": current_user.id
    })
    
    # Log update
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="update_personal_file",
        details={"file_id": file_id, "updates": list(update_data.keys())}
    )
    
    return PersonalFileResponse(**updated_file)

@router.delete("/{file_id}", response_model=MessageResponse)
async def delete_personal_file(
    file_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a personal file."""
    # Validate file_id format
    try:
        uuid.UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file ID format"
        )
    
    # Get file info
    file_data = await db.personal_files.find_one({
        "id": file_id,
        "user_id": current_user.id
    })
    
    if not file_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete physical file if it exists
    if file_data.get("file_path"):
        file_path = UPLOAD_DIR / file_data["file_path"]
        if file_path.exists() and file_path.is_file():
            # Verify the file is within the uploads directory
            try:
                file_path.relative_to(UPLOAD_DIR)
                file_path.unlink(missing_ok=True)
            except ValueError:
                # File is outside uploads directory - security issue
                logger.error(f"Attempted to delete file outside uploads: {file_path}")
    
    # Delete from database
    await db.personal_files.delete_one({
        "id": file_id,
        "user_id": current_user.id
    })
    
    # Log deletion
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="delete_personal_file",
        details={"file_id": file_id, "filename": file_data.get("title")}
    )
    
    return MessageResponse(message="File deleted successfully")

@router.post("/sync", response_model=MessageResponse)
async def sync_local_files(
    local_files: List[PersonalFileCreate],
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Sync files from localStorage to database."""
    # Limit number of files that can be synced at once
    if len(local_files) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot sync more than 100 files at once"
        )
    
    synced_count = 0
    for file_data in local_files:
        # Validate each file
        if file_data.type not in ["note", "link", "file"]:
            continue
            
        personal_file = PersonalFile(
            **file_data.dict(),
            user_id=current_user.id
        )
        
        # Check if file already exists (by title and type)
        existing = await db.personal_files.find_one({
            "user_id": current_user.id,
            "title": personal_file.title,
            "type": personal_file.type
        })
        
        if not existing:
            await db.personal_files.insert_one(personal_file.dict())
            synced_count += 1
    
    # Log sync action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="sync_local_files",
        details={"total_files": len(local_files), "synced": synced_count}
    )
    
    return MessageResponse(message=f"Synced {synced_count} files successfully")

# Import logging
logger = logging.getLogger(__name__)