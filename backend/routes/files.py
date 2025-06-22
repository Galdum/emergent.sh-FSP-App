from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from ..models import PersonalFileCreate, PersonalFileResponse, MessageResponse, PersonalFile
from ..auth import get_current_user
from ..database import get_database
from ..models import UserInDB
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/files", tags=["personal_files"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("/", response_model=List[PersonalFileResponse])
async def get_personal_files(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's personal files."""
    files_cursor = db.personal_files.find({"user_id": current_user.id})
    files_data = await files_cursor.to_list(1000)
    return [PersonalFileResponse(**file_data) for file_data in files_data]

@router.post("/", response_model=PersonalFileResponse)
async def create_personal_file(
    file_data: PersonalFileCreate,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new personal file (note or link)."""
    personal_file = PersonalFile(
        **file_data.dict(),
        user_id=current_user.id
    )
    
    await db.personal_files.insert_one(personal_file.dict())
    return PersonalFileResponse(**personal_file.dict())

@router.post("/upload", response_model=PersonalFileResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Upload a file."""
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create database record
    personal_file = PersonalFile(
        type="file",
        title=file.filename,
        user_id=current_user.id,
        file_path=str(file_path),
        file_size=len(content)
    )
    
    await db.personal_files.insert_one(personal_file.dict())
    return PersonalFileResponse(**personal_file.dict())

@router.put("/{file_id}", response_model=PersonalFileResponse)
async def update_personal_file(
    file_id: str,
    file_data: PersonalFileCreate,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a personal file."""
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
    await db.personal_files.update_one(
        {"id": file_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated file
    updated_file = await db.personal_files.find_one({
        "id": file_id,
        "user_id": current_user.id
    })
    
    return PersonalFileResponse(**updated_file)

@router.delete("/{file_id}", response_model=MessageResponse)
async def delete_personal_file(
    file_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a personal file."""
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
    if file_data.get("file_path") and os.path.exists(file_data["file_path"]):
        os.remove(file_data["file_path"])
    
    # Delete from database
    await db.personal_files.delete_one({
        "id": file_id,
        "user_id": current_user.id
    })
    
    return MessageResponse(message="File deleted successfully")

@router.post("/sync", response_model=MessageResponse)
async def sync_local_files(
    local_files: List[PersonalFileCreate],
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Sync files from localStorage to database."""
    for file_data in local_files:
        personal_file = PersonalFile(
            **file_data.dict(),
            user_id=current_user.id
        )
        await db.personal_files.insert_one(personal_file.dict())
    
    return MessageResponse(message=f"Synced {len(local_files)} files successfully")