from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import os
import jwt
from passlib.context import CryptContext
import uuid

# Simple in-memory database for preview
USERS_DB = {}
DOCUMENTS_DB = {}
CHAT_HISTORY = []

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT settings
JWT_SECRET = os.environ.get("JWT_SECRET", "preview-secret")
JWT_ALGORITHM = "HS256"

app = FastAPI(
    title="ApprobMed Preview API",
    description="Preview version of ApprobMed - AI-powered medical license guide for Germany",
    version="1.0.0-preview"
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

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if email is None or email not in USERS_DB:
            raise HTTPException(status_code=401, detail="Invalid token")
        return USERS_DB[email]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.get("/")
async def root():
    return {
        "message": "Welcome to ApprobMed Preview",
        "docs": "Visit /docs for API documentation",
        "status": "preview_mode"
    }

@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    if user_data.email in USERS_DB:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password_hash": pwd_context.hash(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "created_at": datetime.utcnow()
    }
    USERS_DB[user_data.email] = user
    
    token = create_access_token({"sub": user_data.email})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/api/auth/login")
async def login(login_data: UserLogin):
    user = USERS_DB.get(login_data.email)
    if not user or not pwd_context.verify(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def get_me(current_user=Depends(verify_token)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "first_name": current_user.get("first_name"),
        "last_name": current_user.get("last_name")
    }

@app.get("/api/documents/checklist")
async def get_checklist(current_user=Depends(verify_token)):
    return {
        "checklist": [
            {"type": "diploma", "title": "Medical Diploma", "status": "pending"},
            {"type": "transcript", "title": "Academic Transcript", "status": "pending"},
            {"type": "cv", "title": "Curriculum Vitae", "status": "pending"},
            {"type": "passport", "title": "Passport Copy", "status": "pending"}
        ],
        "progress": {"total": 4, "completed": 0, "percentage": 0}
    }

@app.post("/api/ai-assistant/chat")
async def chat(request: ChatRequest, current_user=Depends(verify_token)):
    # Mock AI response for preview
    responses = {
        "en": f"This is a preview response. In the full version, I would help you with: {request.message}",
        "de": f"Dies ist eine Vorschau-Antwort. In der Vollversion würde ich Ihnen helfen mit: {request.message}",
        "ro": f"Acesta este un răspuns de previzualizare. În versiunea completă, v-aș ajuta cu: {request.message}"
    }
    
    response = {
        "response": responses.get(request.language, responses["en"]),
        "suggestions": ["Complete your profile", "Upload documents", "Check requirements"],
        "next_steps": ["Set your target Bundesland", "Start document collection"]
    }
    
    CHAT_HISTORY.append({
        "user": current_user["email"],
        "message": request.message,
        "response": response["response"],
        "timestamp": datetime.utcnow()
    })
    
    return response

@app.get("/api/documents/requirements/{bundesland}")
async def get_requirements(bundesland: str, current_user=Depends(verify_token)):
    requirements = {
        "bundesland": bundesland,
        "required_documents": [
            {"type": "diploma", "title": "Medical Diploma", "description": "Your medical degree certificate"},
            {"type": "transcript", "title": "Transcript", "description": "Academic records"},
            {"type": "police_certificate", "title": "Police Certificate", "description": "Criminal background check"}
        ],
        "specific_notes": f"Requirements for {bundesland.title()}",
        "overall_progress": 0.0
    }
    return requirements

# Add CORS for frontend access
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting ApprobMed Preview Server...")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔧 This is a preview version with mock data\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
