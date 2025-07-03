from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from typing import List, Optional, Dict
from models import Document, DocumentType, PersonalFile, PersonalFileResponse, MessageResponse
from auth import get_current_user
from database import get_database
from models import UserInDB
from security import AuditLogger
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])

# Bundesland-specific document requirements
BUNDESLAND_REQUIREMENTS = {
    "baden-wuerttemberg": {
        "required": ["diploma", "transcript", "police_certificate", "cv", "passport", "language_certificate"],
        "optional": ["birth_certificate", "marriage_certificate"],
        "specific_notes": "Language certificate must be at least B2 level"
    },
    "bayern": {
        "required": ["diploma", "transcript", "police_certificate", "cv", "passport"],
        "optional": ["language_certificate", "work_experience"],
        "specific_notes": "Police certificate must be apostilled"
    },
    "berlin": {
        "required": ["diploma", "transcript", "police_certificate", "cv", "passport", "language_certificate"],
        "optional": ["recommendation_letters"],
        "specific_notes": "All documents must be translated by sworn translator"
    },
    "nordrhein-westfalen": {
        "required": ["diploma", "transcript", "police_certificate", "cv", "passport"],
        "optional": ["language_certificate", "internship_certificates"],
        "specific_notes": "Diploma must include curriculum details"
    },
    # Add more bundesländer as needed
}

# Document templates and checklists
DOCUMENT_TEMPLATES = {
    "cv": {
        "title": "Curriculum Vitae (Lebenslauf)",
        "description": "Professional CV in German format (tabular form preferred)",
        "tips": [
            "Include photo (common in Germany)",
            "List education in reverse chronological order",
            "Include all medical experience",
            "Mention language skills with levels"
        ]
    },
    "diploma": {
        "title": "Medical Degree Diploma",
        "description": "Your medical school diploma with official translation",
        "tips": [
            "Must be officially translated to German",
            "Include apostille if from non-EU country",
            "Keep original and translation together"
        ]
    },
    "police_certificate": {
        "title": "Police Clearance Certificate",
        "description": "Criminal record check from your home country",
        "tips": [
            "Must be recent (usually not older than 6 months)",
            "May need apostille for non-EU countries",
            "Some states require from all countries you lived in"
        ]
    }
}

@router.get("/requirements/{bundesland}")
async def get_bundesland_requirements(
    bundesland: str,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get document requirements for a specific Bundesland."""
    bundesland = bundesland.lower()
    
    if bundesland not in BUNDESLAND_REQUIREMENTS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Requirements not found for Bundesland: {bundesland}"
        )
    
    requirements = BUNDESLAND_REQUIREMENTS[bundesland]
    
    # Get user's current document status
    user_documents = await db.documents.find({"user_id": current_user.id}).to_list(None)
    
    # Create a status map
    document_status = {doc["document_type"]: doc["status"] for doc in user_documents}
    
    # Build detailed requirements with status
    detailed_requirements = {
        "bundesland": bundesland,
        "required_documents": [],
        "optional_documents": [],
        "specific_notes": requirements.get("specific_notes", ""),
        "overall_progress": 0.0
    }
    
    # Process required documents
    completed_required = 0
    for doc_type in requirements["required"]:
        doc_info = DOCUMENT_TEMPLATES.get(doc_type, {})
        status = document_status.get(doc_type, "not_started")
        
        detailed_requirements["required_documents"].append({
            "type": doc_type,
            "title": doc_info.get("title", doc_type.replace("_", " ").title()),
            "description": doc_info.get("description", ""),
            "status": status,
            "tips": doc_info.get("tips", [])
        })
        
        if status == "verified":
            completed_required += 1
    
    # Process optional documents
    for doc_type in requirements.get("optional", []):
        doc_info = DOCUMENT_TEMPLATES.get(doc_type, {})
        status = document_status.get(doc_type, "not_started")
        
        detailed_requirements["optional_documents"].append({
            "type": doc_type,
            "title": doc_info.get("title", doc_type.replace("_", " ").title()),
            "description": doc_info.get("description", ""),
            "status": status,
            "tips": doc_info.get("tips", [])
        })
    
    # Calculate progress
    total_required = len(requirements["required"])
    if total_required > 0:
        detailed_requirements["overall_progress"] = (completed_required / total_required) * 100
    
    # Log access
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="view_bundesland_requirements",
        details={"bundesland": bundesland}
    )
    
    return detailed_requirements

@router.get("/", response_model=List[Document])
async def get_user_documents(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database),
    document_type: Optional[DocumentType] = None,
    status: Optional[str] = None
):
    """Get all user documents with optional filtering."""
    query = {"user_id": current_user.id}
    
    if document_type:
        query["document_type"] = document_type
    
    if status:
        query["status"] = status
    
    documents = await db.documents.find(query).to_list(None)
    
    return [Document(**doc) for doc in documents]

@router.post("/", response_model=Document)
async def create_document(
    document_data: Dict[str, any],
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new document entry."""
    # Validate document type
    try:
        doc_type = DocumentType(document_data.get("document_type"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document type"
        )
    
    # Check if document already exists
    existing = await db.documents.find_one({
        "user_id": current_user.id,
        "document_type": doc_type
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document of this type already exists"
        )
    
    # Create document
    document = Document(
        user_id=current_user.id,
        document_type=doc_type,
        title=document_data.get("title", doc_type.value.replace("_", " ").title()),
        description=document_data.get("description"),
        bundesland_specific=document_data.get("bundesland_specific", False),
        required_for_bundesland=document_data.get("required_for_bundesland", []),
        status="pending"
    )
    
    await db.documents.insert_one(document.dict())
    
    # Log action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="create_document",
        details={"document_id": document.id, "type": doc_type.value}
    )
    
    return document

@router.put("/{document_id}/upload")
async def upload_document_file(
    document_id: str,
    file_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Link an uploaded file to a document."""
    # Get document
    document = await db.documents.find_one({
        "id": document_id,
        "user_id": current_user.id
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Verify file exists and belongs to user
    file_data = await db.personal_files.find_one({
        "id": file_id,
        "user_id": current_user.id
    })
    
    if not file_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Update document
    await db.documents.update_one(
        {"id": document_id},
        {
            "$set": {
                "file_id": file_id,
                "status": "uploaded",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update file with document type
    await db.personal_files.update_one(
        {"id": file_id},
        {
            "$set": {
                "document_type": document["document_type"],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Log action
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="upload_document",
        details={
            "document_id": document_id,
            "file_id": file_id,
            "document_type": document["document_type"]
        }
    )
    
    return {"message": "Document uploaded successfully", "status": "uploaded"}

@router.get("/checklist")
async def get_document_checklist(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get personalized document checklist based on user's profile."""
    # Get user's target bundesland
    bundesland = current_user.target_bundesland
    
    if not bundesland:
        # Return generic checklist
        checklist = {
            "message": "Please set your target Bundesland for personalized requirements",
            "generic_documents": list(DOCUMENT_TEMPLATES.keys()),
            "next_steps": [
                "Update your profile with target Bundesland",
                "Upload your medical diploma",
                "Get documents translated if needed"
            ]
        }
    else:
        # Get bundesland-specific requirements
        requirements = BUNDESLAND_REQUIREMENTS.get(bundesland.lower(), {})
        user_documents = await db.documents.find({"user_id": current_user.id}).to_list(None)
        
        # Create status map
        doc_status = {doc["document_type"]: doc for doc in user_documents}
        
        checklist = {
            "bundesland": bundesland,
            "checklist": [],
            "progress": {
                "total": 0,
                "completed": 0,
                "percentage": 0.0
            },
            "next_steps": []
        }
        
        # Process required documents
        for doc_type in requirements.get("required", []):
            doc_info = DOCUMENT_TEMPLATES.get(doc_type, {})
            doc_data = doc_status.get(doc_type, {})
            
            item = {
                "type": doc_type,
                "title": doc_info.get("title", doc_type.replace("_", " ").title()),
                "required": True,
                "status": doc_data.get("status", "not_started"),
                "file_id": doc_data.get("file_id"),
                "tips": doc_info.get("tips", [])
            }
            
            checklist["checklist"].append(item)
            checklist["progress"]["total"] += 1
            
            if item["status"] == "verified":
                checklist["progress"]["completed"] += 1
            elif item["status"] == "not_started":
                checklist["next_steps"].append(f"Upload your {item['title']}")
        
        # Calculate progress percentage
        if checklist["progress"]["total"] > 0:
            checklist["progress"]["percentage"] = (
                checklist["progress"]["completed"] / checklist["progress"]["total"]
            ) * 100
    
    return checklist

@router.get("/timeline")
async def get_approbation_timeline(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get estimated timeline for Approbation process."""
    bundesland = current_user.target_bundesland or "generic"
    
    # Timeline estimates (in weeks)
    timelines = {
        "baden-wuerttemberg": {
            "document_preparation": 4,
            "translation_apostille": 3,
            "application_submission": 1,
            "processing_time": 12,
            "fsp_preparation": 8,
            "total_estimated": 28
        },
        "bayern": {
            "document_preparation": 4,
            "translation_apostille": 2,
            "application_submission": 1,
            "processing_time": 16,
            "fsp_preparation": 8,
            "total_estimated": 31
        },
        "generic": {
            "document_preparation": 4,
            "translation_apostille": 3,
            "application_submission": 1,
            "processing_time": 14,
            "fsp_preparation": 8,
            "total_estimated": 30
        }
    }
    
    timeline = timelines.get(bundesland.lower(), timelines["generic"])
    
    # Get user's current progress
    user_documents = await db.documents.find({"user_id": current_user.id}).to_list(None)
    verified_count = sum(1 for doc in user_documents if doc["status"] == "verified")
    
    # Calculate adjusted timeline based on progress
    if verified_count > 0:
        # Reduce document preparation time proportionally
        total_docs = len(BUNDESLAND_REQUIREMENTS.get(bundesland.lower(), {}).get("required", []))
        if total_docs > 0:
            progress_factor = verified_count / total_docs
            timeline["document_preparation"] = int(timeline["document_preparation"] * (1 - progress_factor))
            timeline["total_estimated"] = sum(v for k, v in timeline.items() if k != "total_estimated")
    
    return {
        "bundesland": bundesland,
        "timeline_weeks": timeline,
        "current_stage": "document_preparation" if verified_count < 3 else "translation_apostille",
        "estimated_completion": datetime.utcnow() + timedelta(weeks=timeline["total_estimated"]),
        "tips": [
            "Start with documents that take longest to obtain",
            "Book FSP exam early as slots fill quickly",
            "Consider parallel processing of translations"
        ]
    }

@router.post("/{document_id}/verify")
async def verify_document(
    document_id: str,
    verification_notes: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark a document as verified (admin only in production)."""
    # In production, this should require admin privileges
    # For now, allow self-verification for testing
    
    document = await db.documents.find_one({
        "id": document_id,
        "user_id": current_user.id
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document["status"] != "uploaded":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document must be uploaded before verification"
        )
    
    # Update document status
    await db.documents.update_one(
        {"id": document_id},
        {
            "$set": {
                "status": "verified",
                "verified_by": current_user.id,
                "verified_at": datetime.utcnow(),
                "verification_notes": verification_notes,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update associated file
    if document.get("file_id"):
        await db.personal_files.update_one(
            {"id": document["file_id"]},
            {
                "$set": {
                    "is_verified": True,
                    "verified_by": current_user.id,
                    "verified_at": datetime.utcnow()
                }
            }
        )
    
    # Log verification
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="verify_document",
        details={
            "document_id": document_id,
            "document_type": document["document_type"]
        }
    )
    
    return {"message": "Document verified successfully", "status": "verified"}