from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
import sys
from contextlib import asynccontextmanager
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

# Add the parent directory to sys.path
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR.parent))

# Import settings
from backend.settings import settings, get_settings

# Initialize Sentry for error tracking
if settings.sentry_dsn and settings.environment != 'development':
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        environment=settings.environment
    )

# MongoDB connection
client = AsyncIOMotorClient(settings.mongo_url)
db = client[settings.db_name]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        # Test MongoDB connection
        await client.admin.command('ping')
        logger.info(f"✅ Connected to MongoDB: {settings.db_name}")
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        raise RuntimeError(f"MongoDB connection failed: {e}")
    
    # Create database indexes (non-critical, don't fail startup)
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.user_progress.create_index("user_id")
        await db.personal_files.create_index("user_id")
        await db.documents.create_index("user_id")
        await db.fsp_progress.create_index("user_id")
        await db.subscriptions.create_index("user_id")
        await db.badges.create_index("badge_id", unique=True)
        await db.user_badges.create_index("user_id")
        await db.user_badges.create_index([("user_id", 1), ("badge_id", 1)], unique=True)
        await db.user_activity.create_index("user_id")
        await db.user_activity.create_index([("user_id", 1), ("activity_type", 1)])
        await db.user_activity.create_index("created_at")
        await db.user_login_streak.create_index("user_id", unique=True)
        await db.user_stats.create_index("user_id", unique=True)
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"⚠️  Database index creation failed (non-critical): {e}")
    
    yield
    
    # Shutdown
    client.close()
    logger.info("Database connection closed")

# Create the main app with lifespan
app = FastAPI(
    title="FSP Navigator API", 
    version="1.0.0",
    description="AI-powered platform for medical graduates seeking Approbation in Germany",
    lifespan=lifespan
)

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
from backend.routes.auth import router as auth_router
from backend.routes.progress import router as progress_router
from backend.routes.files import router as files_router
from backend.routes.subscription import router as subscription_router
from backend.routes.billing import router as billing_router
from backend.routes.admin import router as admin_router
from backend.routes.monitoring import router as monitoring_router
from backend.routes.backup import router as backup_router
from backend.routes.deployment import router as deployment_router
from backend.routes.gdpr import router as gdpr_router

    # Import new FSP Navigator specific routes
from backend.routes.documents import router as documents_router
from backend.routes.badges import router as badges_router
from backend.routes.mini_games import router as mini_games_router
from backend.routes.reddit_forum import router as reddit_forum_router
from backend.routes.content_management import router as content_management_router
from backend.routes.admin_real import router as admin_real_router
try:
    from backend.routes.ai_assistant import router as ai_assistant_router
    AI_ROUTER_AVAILABLE = True
except ModuleNotFoundError:
    AI_ROUTER_AVAILABLE = False

from backend.routes.mongodb_example import router as mongodb_example_router
from backend.routes.forum import router as forum_router
# from routes.fsp_preparation import router as fsp_router
# from routes.gamification import router as gamification_router

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

    # Include new FSP Navigator routes
api_router.include_router(documents_router)
api_router.include_router(badges_router)
api_router.include_router(mini_games_router)
api_router.include_router(reddit_forum_router)
api_router.include_router(content_management_router)
api_router.include_router(admin_real_router)
if AI_ROUTER_AVAILABLE:
    api_router.include_router(ai_assistant_router)
api_router.include_router(mongodb_example_router)
api_router.include_router(forum_router)
# api_router.include_router(fsp_router)
# api_router.include_router(gamification_router)

# Legacy routes for compatibility
@api_router.get("/")
async def root():
    return {
        "message": "FSP Navigator API", 
        "version": "1.0.0",
        "description": "AI-powered platform for medical graduates seeking Approbation in Germany"
    }

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

# MongoDB connection test endpoint
@api_router.get("/ping")
async def ping_mongodb():
    """Test MongoDB connection and return 'pong' only if connection succeeds."""
    try:
        await client.admin.command('ping')
        return {"message": "pong", "database": settings.db_name}
    except Exception as e:
        logger.error(f"MongoDB ping failed: {e}")
        raise HTTPException(status_code=500, detail="MongoDB connection failed")

# Include the router in the main app
app.include_router(api_router)

# Configure CORS with proper security
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Add security headers middleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Add rate limiting middleware
from backend.security import limiter, rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Add slowapi rate limiting to the app (only if limiter is available)
if limiter is not None:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
    logger.info("Rate limiting enabled")
else:
    logger.warning("Rate limiting disabled - limiter initialization failed")

try:
    from backend.routes.paypal import router as paypal_router
    PAYPAL_AVAILABLE = True
except ModuleNotFoundError:
    PAYPAL_AVAILABLE = False

if PAYPAL_AVAILABLE:
    api_router.include_router(paypal_router)
