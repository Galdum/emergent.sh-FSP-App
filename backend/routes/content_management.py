"""
Content Management API Routes
Admin routes for editing node content with preview system
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import List, Optional, Dict, Any
import os
import aiofiles
from datetime import datetime, timedelta
import json
import shutil
import mimetypes
import uuid

from backend.models_content import (
    NodeContent, NodeContentCreate, NodeContentUpdate, NodeContentResponse,
    ContentBlock, ContentBlockCreate, ContentBlockUpdate,
    NodeContentVersion, ContentPreview, PreviewRequest, PublishRequest,
    UploadedFile, FileUploadRequest, ContentTemplate,
    ContentStats, ContentUpdateNotification, ContentListResponse
)
from backend.auth import get_current_admin_user
from backend.database import get_database
from backend.models import UserInDB

router = APIRouter(prefix="/content", tags=["content-management"])

# File upload configuration
UPLOAD_DIR = "/app/uploads/content"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    'images': ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
    'documents': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'],
    'media': ['.mp4', '.mp3', '.wav', '.avi']
}

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Utility functions
def get_file_type(filename: str) -> str:
    """Determine file type based on extension"""
    ext = os.path.splitext(filename)[1].lower()
    
    if ext in ALLOWED_EXTENSIONS['images']:
        return 'image'
    elif ext in ALLOWED_EXTENSIONS['documents']:
        return 'document'
    elif ext in ALLOWED_EXTENSIONS['media']:
        return 'media'
    else:
        return 'unknown'

def validate_file_upload(file: UploadFile) -> bool:
    """Validate uploaded file"""
    if file.size > MAX_FILE_SIZE:
        return False
    
    ext = os.path.splitext(file.filename)[1].lower()
    all_allowed = []
    for exts in ALLOWED_EXTENSIONS.values():
        all_allowed.extend(exts)
    
    return ext in all_allowed

# Content CRUD Operations
@router.get("/nodes", response_model=ContentListResponse)
async def get_all_node_content(
    page: int = 1,
    per_page: int = 20,
    node_type: Optional[str] = None,
    search: Optional[str] = None,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get all node content with pagination and filtering"""
    try:
        skip = (page - 1) * per_page
        query = {}
        
        if node_type:
            query["node_type"] = node_type
            
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total = await db.node_content.count_documents(query)
        
        # Get content with pagination
        cursor = db.node_content.find(query).skip(skip).limit(per_page).sort("created_at", -1)
        contents_data = await cursor.to_list(per_page)
        
        # Enhance with additional data
        enhanced_contents = []
        for content_data in contents_data:
            # Get version count
            version_count = await db.content_versions.count_documents({"content_id": content_data["id"]})
            
            # Check for preview
            has_preview = await db.content_previews.count_documents({
                "content_id": content_data["id"],
                "expires_at": {"$gt": datetime.utcnow()}
            }) > 0
            
            # Get stats
            stats_data = await db.content_stats.find_one({"content_id": content_data["id"]})
            stats = ContentStats(**stats_data) if stats_data else None
            
            content_response = NodeContentResponse(
                **content_data,
                version_count=version_count,
                has_preview=has_preview,
                stats=stats
            )
            enhanced_contents.append(content_response)
        
        return ContentListResponse(
            contents=enhanced_contents,
            total=total,
            page=page,
            per_page=per_page,
            has_next=skip + per_page < total,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching content: {str(e)}"
        )

@router.get("/nodes/{node_id}", response_model=NodeContentResponse)
async def get_node_content(
    node_id: str,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get content for a specific node"""
    try:
        content_data = await db.node_content.find_one({"node_id": node_id})
        
        if not content_data:
            # Create default content structure if none exists
            default_content = NodeContent(
                node_id=node_id,
                node_type="step",  # Will be updated based on actual node
                title=f"Node {node_id}",
                description="This node content is editable by administrators.",
                blocks=[],
                created_by=admin_user.id,
                updated_by=admin_user.id
            )
            
            await db.node_content.insert_one(default_content.dict())
            content_data = default_content.dict()
        
        # Get additional data
        version_count = await db.content_versions.count_documents({"content_id": content_data["id"]})
        has_preview = await db.content_previews.count_documents({
            "content_id": content_data["id"],
            "expires_at": {"$gt": datetime.utcnow()}
        }) > 0
        
        stats_data = await db.content_stats.find_one({"content_id": content_data["id"]})
        stats = ContentStats(**stats_data) if stats_data else None
        
        return NodeContentResponse(
            **content_data,
            version_count=version_count,
            has_preview=has_preview,
            stats=stats
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching node content: {str(e)}"
        )

@router.put("/nodes/{node_id}")
async def update_node_content(
    node_id: str,
    content_update: NodeContentUpdate,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Update node content (creates new version)"""
    try:
        existing_content = await db.node_content.find_one({"node_id": node_id})
        
        if not existing_content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Node content not found"
            )
        
        # Create version backup before update
        version = NodeContentVersion(
            content_id=existing_content["id"],
            version_number=existing_content.get("version", 1),
            content_snapshot=NodeContent(**existing_content),
            changed_by=admin_user.id
        )
        await db.content_versions.insert_one(version.dict())
        
        # Prepare update data
        update_data = content_update.dict(exclude_unset=True)
        update_data.update({
            "updated_by": admin_user.id,
            "updated_at": datetime.utcnow(),
            "version": existing_content.get("version", 1) + 1
        })
        
        # Update content
        await db.node_content.update_one(
            {"node_id": node_id},
            {"$set": update_data}
        )
        
        # Send real-time notification
        notification = ContentUpdateNotification(
            content_id=existing_content["id"],
            node_id=node_id,
            update_type="updated",
            updated_by=admin_user.email
        )
        await db.content_notifications.insert_one(notification.dict())
        
        return {"message": "Content updated successfully", "version": update_data["version"]}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating content: {str(e)}"
        )

# Preview System
@router.post("/nodes/{node_id}/preview")
async def create_preview(
    node_id: str,
    preview_request: PreviewRequest,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Create a preview of changes without publishing"""
    try:
        existing_content = await db.node_content.find_one({"node_id": node_id})
        
        if not existing_content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Node content not found"
            )
        
        # Apply changes to create preview content
        preview_content_dict = existing_content.copy()
        changes_dict = preview_request.changes.dict(exclude_unset=True)
        preview_content_dict.update(changes_dict)
        preview_content_dict["updated_by"] = admin_user.id
        preview_content_dict["updated_at"] = datetime.utcnow()
        
        # Create preview
        preview = ContentPreview(
            content_id=existing_content["id"],
            preview_content=NodeContent(**preview_content_dict),
            created_by=admin_user.id,
            expires_at=datetime.utcnow() + timedelta(hours=preview_request.preview_duration_hours)
        )
        
        await db.content_previews.insert_one(preview.dict())
        
        return {
            "message": "Preview created successfully",
            "preview_id": preview.id,
            "expires_at": preview.expires_at,
            "preview_content": preview.preview_content
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating preview: {str(e)}"
        )

@router.get("/nodes/{node_id}/preview/{preview_id}")
async def get_preview(
    node_id: str,
    preview_id: str,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get preview content"""
    try:
        preview_data = await db.content_previews.find_one({
            "id": preview_id,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not preview_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preview not found or expired"
            )
        
        return ContentPreview(**preview_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching preview: {str(e)}"
        )

@router.post("/previews/{preview_id}/publish")
async def publish_preview(
    preview_id: str,
    publish_request: PublishRequest,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Publish a preview to make it live"""
    try:
        preview_data = await db.content_previews.find_one({
            "id": preview_id,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not preview_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preview not found or expired"
            )
        
        preview = ContentPreview(**preview_data)
        content_id = preview.content_id
        
        # Get current content for version backup
        current_content = await db.node_content.find_one({"id": content_id})
        
        # Create version backup
        version = NodeContentVersion(
            content_id=content_id,
            version_number=current_content.get("version", 1),
            content_snapshot=NodeContent(**current_content),
            change_description=publish_request.change_description,
            changed_by=admin_user.id
        )
        await db.content_versions.insert_one(version.dict())
        
        # Publish preview content
        preview_content_dict = preview.preview_content.dict()
        preview_content_dict["version"] = current_content.get("version", 1) + 1
        preview_content_dict["is_published"] = True
        preview_content_dict["updated_by"] = admin_user.id
        preview_content_dict["updated_at"] = datetime.utcnow()
        
        await db.node_content.update_one(
            {"id": content_id},
            {"$set": preview_content_dict}
        )
        
        # Clean up preview
        await db.content_previews.delete_one({"id": preview_id})
        
        # Send real-time notification
        notification = ContentUpdateNotification(
            content_id=content_id,
            node_id=preview.preview_content.node_id,
            update_type="published",
            updated_by=admin_user.email,
            changes_summary=publish_request.change_description
        )
        await db.content_notifications.insert_one(notification.dict())
        
        return {
            "message": "Preview published successfully",
            "version": preview_content_dict["version"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error publishing preview: {str(e)}"
        )

@router.delete("/previews/{preview_id}")
async def discard_preview(
    preview_id: str,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Discard a preview without publishing"""
    try:
        result = await db.content_previews.delete_one({"id": preview_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preview not found"
            )
        
        return {"message": "Preview discarded successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error discarding preview: {str(e)}"
        )

# File Upload Endpoints
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    content_type: str = Form("image"),
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Upload file for content"""
    try:
        # Validate file
        if not validate_file_upload(file):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type or size"
            )
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create file record
        uploaded_file = UploadedFile(
            filename=unique_filename,
            original_name=file.filename,
            file_type=get_file_type(file.filename),
            file_size=file.size,
            mime_type=file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream",
            file_path=file_path,
            uploaded_by=admin_user.id
        )
        
        await db.uploaded_files.insert_one(uploaded_file.dict())
        
        return {
            "message": "File uploaded successfully",
            "file_id": uploaded_file.id,
            "filename": unique_filename,
            "original_name": file.filename,
            "file_type": uploaded_file.file_type,
            "file_size": file.size,
            "url": f"/content/files/{uploaded_file.id}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )

@router.get("/files/{file_id}")
async def serve_file(
    file_id: str,
    db = Depends(get_database)
):
    """Serve uploaded file"""
    from fastapi.responses import FileResponse
    
    try:
        file_data = await db.uploaded_files.find_one({"id": file_id})
        
        if not file_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        if not os.path.exists(file_data["file_path"]):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on disk"
            )
        
        return FileResponse(
            path=file_data["file_path"],
            filename=file_data["original_name"],
            media_type=file_data["mime_type"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving file: {str(e)}"
        )

# Version History
@router.get("/nodes/{node_id}/versions")
async def get_content_versions(
    node_id: str,
    page: int = 1,
    per_page: int = 10,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get version history for node content"""
    try:
        content_data = await db.node_content.find_one({"node_id": node_id})
        
        if not content_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Node content not found"
            )
        
        skip = (page - 1) * per_page
        
        cursor = db.content_versions.find(
            {"content_id": content_data["id"]}
        ).skip(skip).limit(per_page).sort("changed_at", -1)
        
        versions_data = await cursor.to_list(per_page)
        total = await db.content_versions.count_documents({"content_id": content_data["id"]})
        
        versions = [NodeContentVersion(**v) for v in versions_data]
        
        return {
            "versions": versions,
            "total": total,
            "page": page,
            "per_page": per_page,
            "has_next": skip + per_page < total,
            "has_prev": page > 1
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching versions: {str(e)}"
        )

@router.post("/nodes/{node_id}/revert/{version_number}")
async def revert_to_version(
    node_id: str,
    version_number: int,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Revert content to a specific version"""
    try:
        content_data = await db.node_content.find_one({"node_id": node_id})
        
        if not content_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Node content not found"
            )
        
        # Find the version to revert to
        version_data = await db.content_versions.find_one({
            "content_id": content_data["id"],
            "version_number": version_number
        })
        
        if not version_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Version not found"
            )
        
        # Create backup of current version
        current_version = NodeContentVersion(
            content_id=content_data["id"],
            version_number=content_data.get("version", 1),
            content_snapshot=NodeContent(**content_data),
            change_description=f"Backup before revert to version {version_number}",
            changed_by=admin_user.id
        )
        await db.content_versions.insert_one(current_version.dict())
        
        # Revert to selected version
        revert_content = version_data["content_snapshot"]
        revert_content["version"] = content_data.get("version", 1) + 1
        revert_content["updated_by"] = admin_user.id
        revert_content["updated_at"] = datetime.utcnow()
        
        await db.node_content.update_one(
            {"node_id": node_id},
            {"$set": revert_content}
        )
        
        # Send notification
        notification = ContentUpdateNotification(
            content_id=content_data["id"],
            node_id=node_id,
            update_type="reverted",
            updated_by=admin_user.email,
            changes_summary=f"Reverted to version {version_number}"
        )
        await db.content_notifications.insert_one(notification.dict())
        
        return {
            "message": f"Content reverted to version {version_number}",
            "new_version": revert_content["version"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reverting content: {str(e)}"
        )

# Real-time notifications endpoint
@router.get("/notifications")
async def get_content_notifications(
    since: Optional[datetime] = None,
    limit: int = 50,
    admin_user: UserInDB = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get content update notifications for real-time updates"""
    try:
        query = {}
        if since:
            query["timestamp"] = {"$gt": since}
        
        cursor = db.content_notifications.find(query).sort("timestamp", -1).limit(limit)
        notifications_data = await cursor.to_list(limit)
        
        notifications = [ContentUpdateNotification(**n) for n in notifications_data]
        
        return {
            "notifications": notifications,
            "count": len(notifications),
            "latest_timestamp": notifications[0].timestamp if notifications else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching notifications: {str(e)}"
        )