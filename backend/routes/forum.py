from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from backend.models import ForumChannel, ForumThread, ForumMessage, UserInDB
from backend.security import get_current_active_user
from backend.database import db

router = APIRouter(prefix="/forum", tags=["forum"])

# Helper: verifică dacă userul e premium

def require_premium(user: UserInDB = Depends(get_current_active_user)):
    if user.subscription_tier != "PREMIUM":
        raise HTTPException(status_code=403, detail="Acces permis doar pentru utilizatorii premium.")
    return user

# --- Channels ---
@router.get("/channels", response_model=List[ForumChannel])
def list_channels(user: UserInDB = Depends(require_premium)):
    return db.forum_channels.find({"is_active": True})

# --- Threads ---
@router.get("/channels/{channel_id}/threads", response_model=List[ForumThread])
def list_threads(channel_id: str, user: UserInDB = Depends(require_premium)):
    return db.forum_threads.find({"channel_id": channel_id})

@router.post("/channels/{channel_id}/threads", response_model=ForumThread)
def create_thread(channel_id: str, title: str, user: UserInDB = Depends(require_premium)):
    thread = ForumThread(channel_id=channel_id, title=title, created_by=user.id)
    db.forum_threads.insert_one(thread.dict())
    return thread

# --- Messages ---
@router.get("/threads/{thread_id}/messages", response_model=List[ForumMessage])
def list_messages(thread_id: str, user: UserInDB = Depends(require_premium)):
    return db.forum_messages.find({"thread_id": thread_id, "is_deleted": False})

@router.post("/threads/{thread_id}/messages", response_model=ForumMessage)
def create_message(thread_id: str, content: str, user: UserInDB = Depends(require_premium)):
    msg = ForumMessage(thread_id=thread_id, user_id=user.id, content=content)
    db.forum_messages.insert_one(msg.dict())
    return msg