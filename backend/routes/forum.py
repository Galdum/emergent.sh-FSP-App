from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List
from backend.models import ForumChannel, ForumThread, ForumMessage, UserInDB
from backend.security import get_current_active_user
from backend.database import db
from pydantic import BaseModel

router = APIRouter(prefix="/forum", tags=["forum"])

# Helper: verifică dacă userul e premium

def require_premium(user: UserInDB = Depends(get_current_active_user)):
    if user.subscription_tier != "PREMIUM":
        raise HTTPException(status_code=403, detail="Acces permis doar pentru utilizatorii premium.")
    return user

# --- Pydantic models pentru body ---
class ThreadCreateRequest(BaseModel):
    title: str

class MessageCreateRequest(BaseModel):
    content: str

# --- Channels ---
@router.get("/channels", response_model=List[ForumChannel])
async def list_channels(user: UserInDB = Depends(require_premium)):
    channels = await db.forum_channels.find({"is_active": True}).to_list(length=100)
    return channels

# --- Threads ---
@router.get("/channels/{channel_id}/threads", response_model=List[ForumThread])
async def list_threads(channel_id: str, user: UserInDB = Depends(require_premium)):
    threads = await db.forum_threads.find({"channel_id": channel_id}).to_list(length=100)
    return threads

@router.post("/channels/{channel_id}/threads", response_model=ForumThread)
async def create_thread(channel_id: str, req: ThreadCreateRequest, user: UserInDB = Depends(require_premium)):
    thread = ForumThread(channel_id=channel_id, title=req.title, created_by=user.id)
    await db.forum_threads.insert_one(thread.dict())
    return thread

# --- Messages ---
@router.get("/threads/{thread_id}/messages", response_model=List[ForumMessage])
async def list_messages(thread_id: str, user: UserInDB = Depends(require_premium)):
    messages = await db.forum_messages.find({"thread_id": thread_id, "is_deleted": False}).to_list(length=200)
    return messages

@router.post("/threads/{thread_id}/messages", response_model=ForumMessage)
async def create_message(thread_id: str, req: MessageCreateRequest, user: UserInDB = Depends(require_premium)):
    msg = ForumMessage(thread_id=thread_id, user_id=user.id, content=req.content)
    await db.forum_messages.insert_one(msg.dict())
    return msg