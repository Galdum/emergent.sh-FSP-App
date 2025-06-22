from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
import sys

# Add the parent directory to sys.path
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR))
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Medical Licensing Guide API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Legacy models for compatibility
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Database dependency
async def get_database():
    return db

# Create custom dependency for authentication
from backend.auth import verify_token, get_user_by_id

async def get_current_user_with_db(credentials = Depends(HTTPBearer()), db = Depends(get_database)):
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Import routes
from routes.auth import router as auth_router
from routes.progress import router as progress_router
from routes.files import router as files_router
from routes.subscription import router as subscription_router
from routes.billing import router as billing_router
from routes.admin import router as admin_router
from routes.monitoring import router as monitoring_router
from routes.backup import router as backup_router
from routes.deployment import router as deployment_router
from routes.gdpr import router as gdpr_router
from routes.paypal import router as paypal_router

# Override the auth dependency in routes
import backend.routes.auth as auth_module
import backend.routes.progress as progress_module
import backend.routes.files as files_module
import backend.routes.subscription as subscription_module

# Patch the dependencies
auth_module.get_current_user = lambda: Depends(get_current_user_with_db)
progress_module.get_current_user = lambda: Depends(get_current_user_with_db)
files_module.get_current_user = lambda: Depends(get_current_user_with_db)
subscription_module.get_current_user = lambda: Depends(get_current_user_with_db)

# Include routes
api_router.include_router(auth_router)
api_router.include_router(progress_router)
api_router.include_router(files_router)
api_router.include_router(subscription_router)
api_router.include_router(billing_router)
api_router.include_router(admin_router)
api_router.include_router(monitoring_router)
api_router.include_router(backup_router)
api_router.include_router(deployment_router)
api_router.include_router(gdpr_router)
api_router.include_router(paypal_router)

# Legacy routes for compatibility
@api_router.get("/")
async def root():
    return {"message": "Medical Licensing Guide API", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate, db = Depends(get_database)):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(db = Depends(get_database)):
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Create indexes for better performance
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.user_progress.create_index("user_id")
        await db.personal_files.create_index("user_id")
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.info(f"Database indexes already exist or error: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Database connection closed")
