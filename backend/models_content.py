"""
Content Management Models
Models for editable node content system
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import uuid

# Content Types
class ContentBlockType:
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    TABLE = "table"
    LIST = "list"
    LINK = "link"
    DIVIDER = "divider"

class ContentBlock(BaseModel):
    """Individual content block within a node"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # ContentBlockType
    content: Dict[str, Any] = {}  # Flexible content based on type
    position: int = 0
    styles: Dict[str, Any] = {}  # CSS-like styling
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NodeContent(BaseModel):
    """Complete content for a node"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    node_id: str  # Reference to the journey map node
    node_type: str  # "step" or "bonus"
    title: str
    description: Optional[str] = None
    blocks: List[ContentBlock] = []
    layout: Dict[str, Any] = {}  # Layout configuration
    access_level: str = "public"  # public, premium, admin
    version: int = 1
    is_published: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: str

class NodeContentVersion(BaseModel):
    """Version history for node content"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_id: str
    version_number: int
    content_snapshot: NodeContent
    change_description: Optional[str] = None
    changed_by: str
    changed_at: datetime = Field(default_factory=datetime.utcnow)

class ContentPreview(BaseModel):
    """Preview data for unpublished changes"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_id: str
    preview_content: NodeContent
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime

# Content Update Requests
class ContentBlockCreate(BaseModel):
    type: str
    content: Dict[str, Any]
    position: int = 0
    styles: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

class ContentBlockUpdate(BaseModel):
    content: Optional[Dict[str, Any]] = None
    position: Optional[int] = None
    styles: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class NodeContentCreate(BaseModel):
    node_id: str
    node_type: str
    title: str
    description: Optional[str] = None
    blocks: List[ContentBlockCreate] = []
    layout: Dict[str, Any] = {}
    access_level: str = "public"

class NodeContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    blocks: Optional[List[ContentBlockCreate]] = None
    layout: Optional[Dict[str, Any]] = None
    access_level: Optional[str] = None

class PreviewRequest(BaseModel):
    content_id: str
    changes: NodeContentUpdate
    preview_duration_hours: int = 24

class PublishRequest(BaseModel):
    preview_id: str
    change_description: Optional[str] = None

# File Upload Models
class UploadedFile(BaseModel):
    """File metadata for uploaded content"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_name: str
    file_type: str
    file_size: int
    mime_type: str
    file_path: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}  # Width, height for images, etc.

class FileUploadRequest(BaseModel):
    """Request for file upload"""
    content_type: str = "image"  # image, document, etc.
    max_size_mb: int = 10
    allowed_extensions: List[str] = ["jpg", "jpeg", "png", "gif", "pdf", "docx", "pptx"]

# Content Templates
class ContentTemplate(BaseModel):
    """Predefined content templates for quick setup"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    node_type: str
    template_blocks: List[ContentBlockCreate]
    template_layout: Dict[str, Any] = {}
    is_system: bool = False
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Content Statistics
class ContentStats(BaseModel):
    """Content usage and performance stats"""
    content_id: str
    view_count: int = 0
    unique_viewers: int = 0
    last_viewed: Optional[datetime] = None
    edit_count: int = 0
    last_edited: Optional[datetime] = None
    average_time_spent: float = 0.0
    engagement_score: float = 0.0

# Real-time Update Models
class ContentUpdateNotification(BaseModel):
    """Notification for real-time content updates"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_id: str
    node_id: str
    update_type: str  # "published", "preview", "deleted"
    updated_by: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    changes_summary: Optional[str] = None

# Response Models
class NodeContentResponse(NodeContent):
    """Response model with additional computed fields"""
    version_count: int = 0
    has_preview: bool = False
    last_published: Optional[datetime] = None
    stats: Optional[ContentStats] = None

class ContentListResponse(BaseModel):
    """Response for content listing"""
    contents: List[NodeContentResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool