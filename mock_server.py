#!/usr/bin/env python3
"""
Mock FastAPI server for testing the download endpoint without external dependencies.
"""

import os
import sys
import asyncio
import tempfile
import shutil
from pathlib import Path
from typing import Optional
import uuid
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
import jwt
import hashlib
import aiofiles

# Import mock database
from backend.mock_database import mock_db, mock_redis

# Create FastAPI app
app = FastAPI(title="FSP Navigator Mock API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class PersonalFileCreate(BaseModel):
    type: str
    title: str
    content: Optional[str] = None
    url: Optional[str] = None

class PersonalFileResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    mime_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class MessageResponse(BaseModel):
    message: str

# Configuration
JWT_SECRET_KEY = "test_secret_key_for_testing_only"
UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

# Security
security = HTTPBearer()

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return None

async def get_current_user(credentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await mock_db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_database():
    return mock_db

# Authentication endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await mock_db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email.lower(),
        "password_hash": hashlib.sha256(user_data.password.encode()).hexdigest(),  # Simple hash for testing
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "is_admin": False
    }
    
    await mock_db.users.insert_one(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    return Token(access_token=access_token)

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await mock_db.users.find_one({"email": user_data.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
    if user["password_hash"] != password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    return Token(access_token=access_token)

# File endpoints
@app.get("/api/files/", response_model=list[PersonalFileResponse])
async def get_personal_files(
    current_user = Depends(get_current_user),
    db = Depends(get_database),
    skip: int = 0,
    limit: int = 100
):
    files_cursor = await db.personal_files.find({"user_id": current_user["id"]})
    files_data = await files_cursor.skip(skip).limit(limit).to_list(limit)
    return [PersonalFileResponse(**file_data) for file_data in files_data]

@app.post("/api/files/upload", response_model=PersonalFileResponse)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    # Read file content
    file_content = await file.read()
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else ""
    unique_filename = f"{current_user['id']}/{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Create user directory
    file_path.parent.mkdir(exist_ok=True, parents=True)
    
    # Save file
    async with aiofiles.open(file_path, "wb") as buffer:
        await buffer.write(file_content)
    
    # Calculate file hash
    file_hash = hashlib.sha256(file_content).hexdigest()
    
    # Create database record
    personal_file = {
        "id": str(uuid.uuid4()),
        "type": "file",
        "title": file.filename or "uploaded_file",
        "user_id": current_user["id"],
        "file_path": str(unique_filename),
        "file_size": len(file_content),
        "file_hash": file_hash,
        "mime_type": file.content_type,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.personal_files.insert_one(personal_file)
    return PersonalFileResponse(**personal_file)

@app.get("/api/files/download/{file_id}")
async def download_file(
    file_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    # Find the file record
    record = await db.personal_files.find_one({
        "id": file_id,
        "user_id": current_user["id"]
    })
    
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if this is actually a file
    if record.get("type") != "file" or not record.get("file_path"):
        raise HTTPException(status_code=400, detail="This item is not a downloadable file")
    
    # Construct the full file path
    file_path = UPLOAD_DIR / record["file_path"]
    
    # Security check: ensure the file is within the uploads directory
    try:
        file_path.relative_to(UPLOAD_DIR)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    # Check if file exists
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # Return the file
    return FileResponse(
        path=str(file_path),
        filename=record.get("title", "download"),
        media_type=record.get("mime_type")
    )

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Mock FSP Navigator API Server...")
    print(f"📁 Upload directory: {UPLOAD_DIR}")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs will be available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)