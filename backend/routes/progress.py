from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from backend.models import UserProgress, ProgressUpdate, MessageResponse, StepProgress, TaskProgress
from backend.auth import get_current_user
from backend.database import get_database
from backend.models import UserInDB
from datetime import datetime

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/", response_model=UserProgress)
async def get_user_progress(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's progress."""
    progress_data = await db.user_progress.find_one({"user_id": current_user.id})
    
    if not progress_data:
        # Create initial progress for new user
        initial_progress = UserProgress(
            user_id=current_user.id,
            steps=[
                StepProgress(step_id=i, unlocked=(i == 1)) 
                for i in range(1, 7)
            ]
        )
        await db.user_progress.insert_one(initial_progress.dict())
        return initial_progress
    
    return UserProgress(**progress_data)

@router.put("/", response_model=MessageResponse)
async def update_progress(
    progress_update: ProgressUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update user's progress for a specific task."""
    # Get current progress
    progress_data = await db.user_progress.find_one({"user_id": current_user.id})
    
    if not progress_data:
        # Create initial progress if doesn't exist
        progress = UserProgress(
            user_id=current_user.id,
            steps=[
                StepProgress(step_id=i, unlocked=(i == 1)) 
                for i in range(1, 7)
            ]
        )
    else:
        progress = UserProgress(**progress_data)
    
    # Find and update the specific step and task
    step_found = False
    for step in progress.steps:
        if step.step_id == progress_update.step_id:
            step_found = True
            # Find or create the task
            task_found = False
            for task in step.tasks:
                if task.task_id == progress_update.task_id:
                    task.completed = progress_update.completed
                    task.viewed = progress_update.viewed
                    if progress_update.completed:
                        task.completed_at = datetime.utcnow()
                    task_found = True
                    break
            
            if not task_found:
                # Create new task progress
                new_task = TaskProgress(
                    task_id=progress_update.task_id,
                    completed=progress_update.completed,
                    viewed=progress_update.viewed
                )
                if progress_update.completed:
                    new_task.completed_at = datetime.utcnow()
                step.tasks.append(new_task)
            break
    
    if not step_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Step not found"
        )
    
    # Check if step is complete and unlock next step
    current_step_tasks = [t for t in progress.steps[progress_update.step_id - 1].tasks]
    if current_step_tasks and all(task.completed for task in current_step_tasks):
        # Unlock next step if exists
        if progress_update.step_id < 6:
            for step in progress.steps:
                if step.step_id == progress_update.step_id + 1:
                    step.unlocked = True
                    break
    
    progress.updated_at = datetime.utcnow()
    
    # Save to database
    await db.user_progress.replace_one(
        {"user_id": current_user.id},
        progress.dict(),
        upsert=True
    )
    
    return MessageResponse(message="Progress updated successfully")

@router.post("/sync", response_model=MessageResponse)
async def sync_local_progress(
    local_progress: UserProgress,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Sync progress from localStorage to database."""
    # Set user_id and update timestamp
    local_progress.user_id = current_user.id
    local_progress.updated_at = datetime.utcnow()
    
    # Save to database
    await db.user_progress.replace_one(
        {"user_id": current_user.id},
        local_progress.dict(),
        upsert=True
    )
    
    return MessageResponse(message="Progress synced successfully")