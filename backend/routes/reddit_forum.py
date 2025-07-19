"""
Reddit-style Forum API with premium subscription checks
Provides endpoints for forums, threads, comments, voting, and file attachments
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import List, Optional
from backend.models import (
    Forum, Thread, Comment, Vote, Attachment, AttachmentType,
    ForumCreateRequest, ThreadCreateRequest, ThreadUpdateRequest,
    CommentCreateRequest, CommentUpdateRequest, VoteRequest,
    ThreadResponse, CommentResponse, ForumResponse, UserInDB
)
from backend.auth import get_current_user
from backend.database import db
from backend.upload_service import upload_file
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/forums", tags=["reddit-forum"])

# Premium subscription decorator
def require_premium(user: UserInDB = Depends(get_current_user)):
    """Verify user has premium subscription"""
    if user.subscription_tier != "PREMIUM":
        raise HTTPException(
            status_code=403, 
            detail="Premium subscription required for forum access"
        )
    return user

# --- Forum Management ---

@router.get("/", response_model=List[ForumResponse])
async def list_forums(user: UserInDB = Depends(require_premium)):
    """List all forums the user can view (premium only)"""
    try:
        # Get forums with thread counts and recent activity
        forums = await db.forums.find({"is_active": True}).to_list(length=100)
        
        forum_responses = []
        for forum_data in forums:
            # Count threads in this forum
            thread_count = await db.threads.count_documents({"forum_id": forum_data["id"]})
            
            # Get most recent thread activity
            recent_thread = await db.threads.find_one(
                {"forum_id": forum_data["id"]},
                sort=[("updated_at", -1)]
            )
            recent_activity = recent_thread["updated_at"] if recent_thread else None
            
            forum_response = ForumResponse(
                **forum_data,
                thread_count=thread_count,
                recent_activity=recent_activity
            )
            forum_responses.append(forum_response)
        
        return forum_responses
    except Exception as e:
        logger.error(f"Error listing forums: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=Forum)
async def create_forum(
    forum_data: ForumCreateRequest, 
    user: UserInDB = Depends(require_premium)
):
    """Create a new forum (available to premium users)"""
    try:
        # Check if slug already exists
        existing = await db.forums.find_one({"slug": forum_data.slug})
        if existing:
            raise HTTPException(status_code=400, detail="Forum with this slug already exists")
        
        forum = Forum(**forum_data.dict(), created_by=user.id)
        await db.forums.insert_one(forum.dict())
        return forum
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating forum: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{forum_slug}", response_model=ForumResponse)
async def get_forum(forum_slug: str, user: UserInDB = Depends(require_premium)):
    """Get forum details by slug"""
    try:
        forum_data = await db.forums.find_one({"slug": forum_slug, "is_active": True})
        if not forum_data:
            raise HTTPException(status_code=404, detail="Forum not found")
        
        # Count threads and get recent activity
        thread_count = await db.threads.count_documents({"forum_id": forum_data["id"]})
        recent_thread = await db.threads.find_one(
            {"forum_id": forum_data["id"]},
            sort=[("updated_at", -1)]
        )
        recent_activity = recent_thread["updated_at"] if recent_thread else None
        
        return ForumResponse(
            **forum_data,
            thread_count=thread_count,
            recent_activity=recent_activity
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting forum: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# --- Thread Management ---

@router.get("/{forum_slug}/threads", response_model=List[ThreadResponse])
async def list_threads(
    forum_slug: str,
    user: UserInDB = Depends(require_premium),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("recent", regex="^(recent|popular|oldest)$")
):
    """List threads in a forum with pagination"""
    try:
        # Get forum
        forum = await db.forums.find_one({"slug": forum_slug, "is_active": True})
        if not forum:
            raise HTTPException(status_code=404, detail="Forum not found")
        
        # Determine sort order
        sort_field = "updated_at" if sort == "recent" else "created_at"
        sort_direction = -1 if sort in ["recent", "popular"] else 1
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get threads
        threads_cursor = db.threads.find({"forum_id": forum["id"]})
        
        if sort == "popular":
            # Sort by vote score (up_votes - down_votes)
            threads = await threads_cursor.to_list(length=None)
            threads.sort(key=lambda x: x["up_votes"] - x["down_votes"], reverse=True)
            threads = threads[skip:skip + limit]
        else:
            threads = await threads_cursor.sort(sort_field, sort_direction).skip(skip).limit(limit).to_list(length=limit)
        
        # Get user votes for these threads
        thread_ids = [t["id"] for t in threads]
        user_votes = {}
        if thread_ids:
            votes_cursor = db.votes.find({
                "user_id": user.id,
                "target_id": {"$in": thread_ids},
                "target_type": "thread"
            })
            async for vote in votes_cursor:
                user_votes[vote["target_id"]] = vote["value"]
        
        # Get comment counts for threads
        comment_counts = {}
        for thread_id in thread_ids:
            count = await db.comments.count_documents({"thread_id": thread_id, "is_deleted": False})
            comment_counts[thread_id] = count
        
        # Build response
        thread_responses = []
        for thread_data in threads:
            thread_response = ThreadResponse(
                **thread_data,
                comment_count=comment_counts.get(thread_data["id"], 0),
                user_vote=user_votes.get(thread_data["id"])
            )
            thread_responses.append(thread_response)
        
        return thread_responses
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing threads: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{forum_slug}/threads", response_model=ThreadResponse)
async def create_thread(
    forum_slug: str,
    thread_data: ThreadCreateRequest,
    user: UserInDB = Depends(require_premium)
):
    """Create a new thread in a forum"""
    try:
        # Get forum
        forum = await db.forums.find_one({"slug": forum_slug, "is_active": True})
        if not forum:
            raise HTTPException(status_code=404, detail="Forum not found")
        
        # Process attachments
        attachments = []
        for att_data in thread_data.attachments:
            attachment = Attachment(**att_data)
            attachments.append(attachment)
        
        # Create thread
        thread = Thread(
            forum_id=forum["id"],
            author_id=user.id,
            title=thread_data.title,
            body=thread_data.body,
            attachments=attachments
        )
        
        await db.threads.insert_one(thread.dict())
        
        return ThreadResponse(
            **thread.dict(),
            comment_count=0,
            user_vote=None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating thread: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/thread/{thread_id}", response_model=ThreadResponse)
async def get_thread(thread_id: str, user: UserInDB = Depends(require_premium)):
    """Get thread details with comments"""
    try:
        thread_data = await db.threads.find_one({"id": thread_id})
        if not thread_data:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Get user's vote on this thread
        user_vote_data = await db.votes.find_one({
            "user_id": user.id,
            "target_id": thread_id,
            "target_type": "thread"
        })
        user_vote = user_vote_data["value"] if user_vote_data else None
        
        # Get comment count
        comment_count = await db.comments.count_documents({"thread_id": thread_id, "is_deleted": False})
        
        return ThreadResponse(
            **thread_data,
            comment_count=comment_count,
            user_vote=user_vote
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting thread: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# --- Comment Management ---

@router.get("/thread/{thread_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    thread_id: str, 
    user: UserInDB = Depends(require_premium),
    sort: str = Query("best", regex="^(best|oldest|newest)$")
):
    """Get comments for a thread with nested structure"""
    try:
        # Verify thread exists
        thread = await db.threads.find_one({"id": thread_id})
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Get all comments for this thread
        comments_cursor = db.comments.find({"thread_id": thread_id, "is_deleted": False})
        
        if sort == "oldest":
            comments_cursor = comments_cursor.sort("created_at", 1)
        elif sort == "newest":
            comments_cursor = comments_cursor.sort("created_at", -1)
        else:  # best
            comments = await comments_cursor.to_list(length=None)
            comments.sort(key=lambda x: x["up_votes"] - x["down_votes"], reverse=True)
        
        if sort != "best":
            comments = await comments_cursor.to_list(length=None)
        
        # Get user votes for all comments
        comment_ids = [c["id"] for c in comments]
        user_votes = {}
        if comment_ids:
            votes_cursor = db.votes.find({
                "user_id": user.id,
                "target_id": {"$in": comment_ids},
                "target_type": "comment"
            })
            async for vote in votes_cursor:
                user_votes[vote["target_id"]] = vote["value"]
        
        # Build nested comment structure
        comment_map = {}
        root_comments = []
        
        # First pass: create all comment objects
        for comment_data in comments:
            comment_response = CommentResponse(
                **comment_data,
                user_vote=user_votes.get(comment_data["id"]),
                replies=[]
            )
            comment_map[comment_data["id"]] = comment_response
        
        # Second pass: organize into tree structure
        for comment_data in comments:
            comment = comment_map[comment_data["id"]]
            if comment_data.get("parent_id"):
                parent = comment_map.get(comment_data["parent_id"])
                if parent:
                    parent.replies.append(comment)
            else:
                root_comments.append(comment)
        
        return root_comments
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting comments: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/thread/{thread_id}/comments", response_model=CommentResponse)
async def create_comment(
    thread_id: str,
    comment_data: CommentCreateRequest,
    user: UserInDB = Depends(require_premium)
):
    """Create a new comment on a thread"""
    try:
        # Verify thread exists and is not locked
        thread = await db.threads.find_one({"id": thread_id})
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        if thread.get("is_locked", False):
            raise HTTPException(status_code=403, detail="Thread is locked")
        
        # If parent_id provided, verify parent comment exists
        if comment_data.parent_id:
            parent_comment = await db.comments.find_one({"id": comment_data.parent_id, "is_deleted": False})
            if not parent_comment:
                raise HTTPException(status_code=404, detail="Parent comment not found")
            if parent_comment["thread_id"] != thread_id:
                raise HTTPException(status_code=400, detail="Parent comment is not in this thread")
        
        # Create comment
        comment = Comment(
            thread_id=thread_id,
            author_id=user.id,
            body=comment_data.body,
            parent_id=comment_data.parent_id
        )
        
        await db.comments.insert_one(comment.dict())
        
        # Update thread's updated_at timestamp
        await db.threads.update_one(
            {"id": thread_id},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        return CommentResponse(
            **comment.dict(),
            user_vote=None,
            replies=[]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating comment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# --- Voting System ---

@router.post("/thread/{thread_id}/vote")
async def vote_thread(
    thread_id: str,
    vote_data: VoteRequest,
    user: UserInDB = Depends(require_premium)
):
    """Vote on a thread"""
    try:
        # Verify thread exists
        thread = await db.threads.find_one({"id": thread_id})
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Check if user already voted
        existing_vote = await db.votes.find_one({
            "user_id": user.id,
            "target_id": thread_id,
            "target_type": "thread"
        })
        
        # Calculate vote changes
        old_value = existing_vote["value"] if existing_vote else 0
        new_value = vote_data.value
        
        if existing_vote:
            # Update existing vote
            await db.votes.update_one(
                {"id": existing_vote["id"]},
                {"$set": {"value": new_value}}
            )
        else:
            # Create new vote
            vote = Vote(
                user_id=user.id,
                target_id=thread_id,
                target_type="thread",
                value=new_value
            )
            await db.votes.insert_one(vote.dict())
        
        # Update thread vote counts
        up_change = 0
        down_change = 0
        
        if old_value == 1 and new_value == 0:  # Remove upvote
            up_change = -1
        elif old_value == 1 and new_value == -1:  # Upvote to downvote
            up_change = -1
            down_change = 1
        elif old_value == -1 and new_value == 0:  # Remove downvote
            down_change = -1
        elif old_value == -1 and new_value == 1:  # Downvote to upvote
            down_change = -1
            up_change = 1
        elif old_value == 0 and new_value == 1:  # New upvote
            up_change = 1
        elif old_value == 0 and new_value == -1:  # New downvote
            down_change = 1
        
        if up_change != 0 or down_change != 0:
            await db.threads.update_one(
                {"id": thread_id},
                {"$inc": {"up_votes": up_change, "down_votes": down_change}}
            )
        
        return {"message": "Vote recorded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error voting on thread: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/comment/{comment_id}/vote")
async def vote_comment(
    comment_id: str,
    vote_data: VoteRequest,
    user: UserInDB = Depends(require_premium)
):
    """Vote on a comment"""
    try:
        # Verify comment exists
        comment = await db.comments.find_one({"id": comment_id, "is_deleted": False})
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Check if user already voted
        existing_vote = await db.votes.find_one({
            "user_id": user.id,
            "target_id": comment_id,
            "target_type": "comment"
        })
        
        # Calculate vote changes
        old_value = existing_vote["value"] if existing_vote else 0
        new_value = vote_data.value
        
        if existing_vote:
            # Update existing vote
            await db.votes.update_one(
                {"id": existing_vote["id"]},
                {"$set": {"value": new_value}}
            )
        else:
            # Create new vote
            vote = Vote(
                user_id=user.id,
                target_id=comment_id,
                target_type="comment",
                value=new_value
            )
            await db.votes.insert_one(vote.dict())
        
        # Update comment vote counts
        up_change = 0
        down_change = 0
        
        if old_value == 1 and new_value == 0:  # Remove upvote
            up_change = -1
        elif old_value == 1 and new_value == -1:  # Upvote to downvote
            up_change = -1
            down_change = 1
        elif old_value == -1 and new_value == 0:  # Remove downvote
            down_change = -1
        elif old_value == -1 and new_value == 1:  # Downvote to upvote
            down_change = -1
            up_change = 1
        elif old_value == 0 and new_value == 1:  # New upvote
            up_change = 1
        elif old_value == 0 and new_value == -1:  # New downvote
            down_change = 1
        
        if up_change != 0 or down_change != 0:
            await db.comments.update_one(
                {"id": comment_id},
                {"$inc": {"up_votes": up_change, "down_votes": down_change}}
            )
        
        return {"message": "Vote recorded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error voting on comment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# --- File Upload (DISABLED) ---
# File upload functionality has been disabled
# Only link attachments are supported

# @router.post("/upload", response_model=Attachment)
# async def upload_attachment(
#     file: UploadFile = File(...),
#     user: UserInDB = Depends(require_premium)
# ):
#     """Upload a file attachment for forum posts (DISABLED)"""
#     raise HTTPException(status_code=501, detail="File uploads are currently disabled")