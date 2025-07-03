from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from database import get_database

router = APIRouter(prefix="/api/mongodb", tags=["mongodb"])

# Pydantic models for request/response
class DocumentBase(BaseModel):
    name: str
    description: Optional[str] = None
    
class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True

# Helper function to convert ObjectId to string
def document_helper(document) -> dict:
    if document:
        document["_id"] = str(document["_id"])
    return document

# GET /api/mongodb/documents - Get all documents
@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all documents from the test collection"""
    try:
        documents = []
        cursor = db.test_collection.find().skip(skip).limit(limit)
        async for document in cursor:
            documents.append(document_helper(document))
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

# GET /api/mongodb/documents/{id} - Get a specific document
@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific document by ID"""
    try:
        if not ObjectId.is_valid(document_id):
            raise HTTPException(status_code=400, detail="Invalid document ID format")
            
        document = await db.test_collection.find_one({"_id": ObjectId(document_id)})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        return document_helper(document)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching document: {str(e)}")

# POST /api/mongodb/documents - Create a new document
@router.post("/documents", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new document"""
    try:
        document_dict = document.dict()
        document_dict["created_at"] = datetime.utcnow()
        
        result = await db.test_collection.insert_one(document_dict)
        
        created_document = await db.test_collection.find_one({"_id": result.inserted_id})
        return document_helper(created_document)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating document: {str(e)}")

# PUT /api/mongodb/documents/{id} - Update a document
@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing document"""
    try:
        if not ObjectId.is_valid(document_id):
            raise HTTPException(status_code=400, detail="Invalid document ID format")
            
        # Filter out None values
        update_data = {k: v for k, v in document_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.test_collection.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
            
        updated_document = await db.test_collection.find_one({"_id": ObjectId(document_id)})
        return document_helper(updated_document)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating document: {str(e)}")

# DELETE /api/mongodb/documents/{id} - Delete a document
@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a document"""
    try:
        if not ObjectId.is_valid(document_id):
            raise HTTPException(status_code=400, detail="Invalid document ID format")
            
        result = await db.test_collection.delete_one({"_id": ObjectId(document_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
            
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

# GET /api/mongodb/stats - Get collection statistics
@router.get("/stats")
async def get_stats(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get statistics about the collection"""
    try:
        count = await db.test_collection.count_documents({})
        
        # Get sample documents
        sample_cursor = db.test_collection.find().limit(5)
        samples = []
        async for doc in sample_cursor:
            samples.append(document_helper(doc))
        
        return {
            "total_documents": count,
            "collection_name": "test_collection",
            "sample_documents": samples
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")