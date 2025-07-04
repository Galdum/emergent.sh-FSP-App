from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from backend.models import (
    Badge, UserBadge, BadgeResponse, UserBadgeProgress, MessageResponse, UserInDB
)
from backend.auth import get_current_user
from backend.database import get_database
from datetime import datetime, timedelta
import asyncio

router = APIRouter(prefix="/badges", tags=["badges"])

# Define all 20 badges
BADGES_DEFINITION = [
    {
        "badge_id": "first_upload",
        "name": "First Upload",
        "description": "Upload your very first document",
        "icon": "first_upload.svg",
        "criteria": "Upload your first document",
        "icon_concept": "Purple shield with a single paper icon"
    },
    {
        "badge_id": "profile_complete",
        "name": "Profile Complete",
        "description": "Fill out all profile fields (name, email, photo)",
        "icon": "profile_complete.svg",
        "criteria": "Complete all profile information",
        "icon_concept": "Teal circle with a user silhouette"
    },
    {
        "badge_id": "chat_starter",
        "name": "Chat Initiator",
        "description": "Send your first message to the AI assistant",
        "icon": "chat_starter.svg",
        "criteria": "Send first AI message",
        "icon_concept": "Blue hexagon with a chat bubble"
    },
    {
        "badge_id": "chat_marathon",
        "name": "Chat Marathon",
        "description": "Send 50 messages total to the AI assistant",
        "icon": "chat_marathon.svg",
        "criteria": "Send 50 AI messages",
        "icon_concept": "Green circle with a lightning bolt"
    },
    {
        "badge_id": "checklist_begin",
        "name": "Checklist Beginner",
        "description": "Complete your first checklist task",
        "icon": "checklist_begin.svg",
        "criteria": "Complete first checklist task",
        "icon_concept": "Orange starburst with a checkmark"
    },
    {
        "badge_id": "checklist_master",
        "name": "Checklist Master",
        "description": "Complete all steps in the onboarding checklist",
        "icon": "checklist_master.svg",
        "criteria": "Complete all checklist steps",
        "icon_concept": "Gold medal with three checkmarks"
    },
    {
        "badge_id": "fsp_simulator",
        "name": "FSP Ace",
        "description": "Pass one simulated FSP case in the tutor",
        "icon": "fsp_simulator.svg",
        "criteria": "Pass FSP simulation",
        "icon_concept": "Navy shield with a graduation cap"
    },
    {
        "badge_id": "doc_manager",
        "name": "Document Manager",
        "description": "Upload 20 distinct files",
        "icon": "doc_manager.svg",
        "criteria": "Upload 20 documents",
        "icon_concept": "Brown folder with a plus sign"
    },
    {
        "badge_id": "email_pro",
        "name": "E-Mail Pro",
        "description": "Generate 5 official emails via the AI e-mail generator",
        "icon": "email_pro.svg",
        "criteria": "Generate 5 emails",
        "icon_concept": "Light blue ribbon with an envelope"
    },
    {
        "badge_id": "tutorial_complete",
        "name": "Tutorial Champ",
        "description": "Finish the introductory tutorial",
        "icon": "tutorial_complete.svg",
        "criteria": "Complete tutorial",
        "icon_concept": "Pink pentagon with a party popper"
    },
    {
        "badge_id": "daily_7",
        "name": "7-Day Streak",
        "description": "Log in 7 days in a row",
        "icon": "daily_7.svg",
        "criteria": "7 consecutive login days",
        "icon_concept": "Red flame on a bronze badge"
    },
    {
        "badge_id": "daily_30",
        "name": "30-Day Streak",
        "description": "Log in 30 days in a row",
        "icon": "daily_30.svg",
        "criteria": "30 consecutive login days",
        "icon_concept": "Silver snowflake on a silver badge"
    },
    {
        "badge_id": "referrer",
        "name": "Referral Star",
        "description": "Invite your first friend (they sign up)",
        "icon": "referrer.svg",
        "criteria": "Successful referral",
        "icon_concept": "Yellow star on a circular badge"
    },
    {
        "badge_id": "social_butterfly",
        "name": "Social Butterfly",
        "description": "Join or link 5 Facebook groups through the app",
        "icon": "social_butterfly.svg",
        "criteria": "Join 5 Facebook groups",
        "icon_concept": "Green leaf on an emerald badge"
    },
    {
        "badge_id": "badge_collector",
        "name": "Badge Collector",
        "description": "Earn 5 different badges",
        "icon": "badge_collector.svg",
        "criteria": "Earn 5 badges",
        "icon_concept": "Cyan hexagon with five small stars"
    },
    {
        "badge_id": "data_master",
        "name": "Data Master",
        "description": "Perform 50 searches in the info-hub",
        "icon": "data_master.svg",
        "criteria": "Perform 50 searches",
        "icon_concept": "Teal circle with a magnifier"
    },
    {
        "badge_id": "feedback_giver",
        "name": "Feedback Giver",
        "description": "Submit 3 ratings or feedback comments",
        "icon": "feedback_giver.svg",
        "criteria": "Submit 3 feedback items",
        "icon_concept": "Gray shield with a pencil"
    },
    {
        "badge_id": "land_explorer",
        "name": "Land Explorer",
        "description": "Apply for Approbation in 3 different Länder",
        "icon": "land_explorer.svg",
        "criteria": "Apply in 3 different Länder",
        "icon_concept": "Orange ribbon with map pin"
    },
    {
        "badge_id": "hospitation_hero",
        "name": "Hospitation Hero",
        "description": "Upload hospitation certificate",
        "icon": "hospitation_hero.svg",
        "criteria": "Upload hospitation certificate",
        "icon_concept": "Blue house icon on a blue badge"
    },
    {
        "badge_id": "champion",
        "name": "FSP Champion",
        "description": "Earn 10 badges",
        "icon": "champion.svg",
        "criteria": "Earn 10 badges",
        "icon_concept": "Gold trophy on a multicolor badge"
    }
]

async def initialize_badges(db):
    """Initialize the badges collection with predefined badges."""
    badges_collection = db.badges
    
    for badge_data in BADGES_DEFINITION:
        existing_badge = await badges_collection.find_one({"badge_id": badge_data["badge_id"]})
        if not existing_badge:
            badge = Badge(**badge_data)
            await badges_collection.insert_one(badge.dict())

@router.get("/", response_model=List[BadgeResponse])
async def get_user_badges(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all badges with user's earned status."""
    # Ensure badges are initialized
    await initialize_badges(db)
    
    # Get all badges
    badges_cursor = db.badges.find({})
    all_badges = await badges_cursor.to_list(length=None)
    
    # Get user's earned badges
    user_badges_cursor = db.user_badges.find({"user_id": current_user.id})
    user_badges = await user_badges_cursor.to_list(length=None)
    earned_badge_ids = {ub["badge_id"] for ub in user_badges}
    
    result = []
    for badge in all_badges:
        badge_response = BadgeResponse(
            badge_id=badge["badge_id"],
            name=badge["name"],
            description=badge["description"],
            icon=badge["icon"],
            criteria=badge["criteria"],
            icon_concept=badge["icon_concept"],
            earned=badge["badge_id"] in earned_badge_ids
        )
        
        # Add awarded_at if earned
        if badge["badge_id"] in earned_badge_ids:
            user_badge = next(ub for ub in user_badges if ub["badge_id"] == badge["badge_id"])
            badge_response.awarded_at = user_badge["awarded_at"]
        
        result.append(badge_response)
    
    return result

@router.get("/progress", response_model=UserBadgeProgress)
async def get_badge_progress(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's badge progress and statistics."""
    # Get user's earned badges
    user_badges_cursor = db.user_badges.find({"user_id": current_user.id})
    user_badges = await user_badges_cursor.to_list(length=None)
    earned_badge_ids = [ub["badge_id"] for ub in user_badges]
    
    # Get user's progress stats (you'll need to implement these queries based on your data)
    user_stats = await get_user_progress_stats(db, current_user.id)
    
    return UserBadgeProgress(
        user_id=current_user.id,
        badges_earned=earned_badge_ids,
        total_badges=len(BADGES_DEFINITION),
        badge_count=len(earned_badge_ids),
        **user_stats
    )

async def get_user_progress_stats(db, user_id: str) -> Dict[str, Any]:
    """Get user's progress statistics for badge calculations."""
    # Get documents uploaded
    documents_count = await db.personal_files.count_documents({"user_id": user_id})
    
    # Get messages sent (if you have a messages collection)
    messages_count = 0  # TODO: implement based on your AI chat system
    
    # Get checklist progress
    progress_data = await db.user_progress.find_one({"user_id": user_id})
    checklist_tasks = 0
    if progress_data:
        for step in progress_data.get("steps", []):
            checklist_tasks += len([t for t in step.get("tasks", []) if t.get("completed", False)])
    
    # Get user profile completion
    user_data = await db.users.find_one({"id": user_id})
    profile_completed = False
    if user_data:
        profile_completed = bool(
            user_data.get("first_name") and 
            user_data.get("last_name") and 
            user_data.get("email")
        )
    
    return {
        "documents_uploaded": documents_count,
        "messages_sent": messages_count,
        "checklist_tasks_completed": checklist_tasks,
        "profile_completed": profile_completed,
        "emails_generated": 0,  # TODO: implement based on your email generation system
        "consecutive_days": 0,  # TODO: implement login streak tracking
        "searches_performed": 0,  # TODO: implement search tracking
        "feedback_submitted": 0,  # TODO: implement feedback tracking
        "referrals_made": 0,  # TODO: implement referral tracking
        "facebook_groups_joined": 0,  # TODO: implement social tracking
        "lander_applications": 0,  # TODO: implement application tracking
        "fsp_simulations_passed": 0,  # TODO: implement FSP simulation tracking
        "tutorial_completed": False,  # TODO: implement tutorial tracking
        "hospitation_uploaded": False  # TODO: implement hospitation tracking
    }

async def award_badge(db, user_id: str, badge_id: str) -> bool:
    """Award a badge to a user if they don't already have it."""
    # Check if user already has this badge
    existing_badge = await db.user_badges.find_one({
        "user_id": user_id,
        "badge_id": badge_id
    })
    
    if existing_badge:
        return False  # Already awarded
    
    # Award the badge
    user_badge = UserBadge(
        user_id=user_id,
        badge_id=badge_id
    )
    
    await db.user_badges.insert_one(user_badge.dict())
    return True

async def check_and_award_badges(db, user_id: str) -> List[str]:
    """Check all badge criteria and award any newly earned badges."""
    newly_awarded = []
    stats = await get_user_progress_stats(db, user_id)
    
    # Check each badge's criteria
    if stats["documents_uploaded"] >= 1:
        if await award_badge(db, user_id, "first_upload"):
            newly_awarded.append("first_upload")
    
    if stats["profile_completed"]:
        if await award_badge(db, user_id, "profile_complete"):
            newly_awarded.append("profile_complete")
    
    if stats["messages_sent"] >= 1:
        if await award_badge(db, user_id, "chat_starter"):
            newly_awarded.append("chat_starter")
    
    if stats["messages_sent"] >= 50:
        if await award_badge(db, user_id, "chat_marathon"):
            newly_awarded.append("chat_marathon")
    
    if stats["checklist_tasks_completed"] >= 1:
        if await award_badge(db, user_id, "checklist_begin"):
            newly_awarded.append("checklist_begin")
    
    if stats["documents_uploaded"] >= 20:
        if await award_badge(db, user_id, "doc_manager"):
            newly_awarded.append("doc_manager")
    
    if stats["emails_generated"] >= 5:
        if await award_badge(db, user_id, "email_pro"):
            newly_awarded.append("email_pro")
    
    if stats["tutorial_completed"]:
        if await award_badge(db, user_id, "tutorial_complete"):
            newly_awarded.append("tutorial_complete")
    
    if stats["consecutive_days"] >= 7:
        if await award_badge(db, user_id, "daily_7"):
            newly_awarded.append("daily_7")
    
    if stats["consecutive_days"] >= 30:
        if await award_badge(db, user_id, "daily_30"):
            newly_awarded.append("daily_30")
    
    if stats["searches_performed"] >= 50:
        if await award_badge(db, user_id, "data_master"):
            newly_awarded.append("data_master")
    
    if stats["feedback_submitted"] >= 3:
        if await award_badge(db, user_id, "feedback_giver"):
            newly_awarded.append("feedback_giver")
    
    if stats["hospitation_uploaded"]:
        if await award_badge(db, user_id, "hospitation_hero"):
            newly_awarded.append("hospitation_hero")
    
    # Check meta badges (badges that depend on other badges)
    user_badges_count = await db.user_badges.count_documents({"user_id": user_id})
    
    if user_badges_count >= 5:
        if await award_badge(db, user_id, "badge_collector"):
            newly_awarded.append("badge_collector")
    
    if user_badges_count >= 10:
        if await award_badge(db, user_id, "champion"):
            newly_awarded.append("champion")
    
    return newly_awarded

@router.post("/check", response_model=Dict[str, Any])
async def check_badges(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Manually check and award badges for the current user."""
    newly_awarded = await check_and_award_badges(db, current_user.id)
    
    return {
        "newly_awarded": newly_awarded,
        "count": len(newly_awarded),
        "message": f"Awarded {len(newly_awarded)} new badges" if newly_awarded else "No new badges earned"
    }

@router.get("/leaderboard", response_model=List[Dict[str, Any]])
async def get_badge_leaderboard(
    limit: int = 10,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get badge leaderboard showing top users by badge count."""
    # Aggregate user badge counts
    pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "badge_count": {"$sum": 1},
                "latest_badge": {"$max": "$awarded_at"}
            }
        },
        {
            "$sort": {"badge_count": -1, "latest_badge": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    leaderboard_data = await db.user_badges.aggregate(pipeline).to_list(length=None)
    
    # Get user details and top badges
    result = []
    for entry in leaderboard_data:
        user_data = await db.users.find_one({"id": entry["_id"]})
        if user_data:
            # Get user's top 3 most recent badges
            user_badges = await db.user_badges.find(
                {"user_id": entry["_id"]}
            ).sort("awarded_at", -1).limit(3).to_list(length=None)
            
            # Get badge details
            top_badges = []
            for ub in user_badges:
                badge_data = await db.badges.find_one({"badge_id": ub["badge_id"]})
                if badge_data:
                    top_badges.append({
                        "badge_id": badge_data["badge_id"],
                        "name": badge_data["name"],
                        "icon": badge_data["icon"],
                        "awarded_at": ub["awarded_at"]
                    })
            
            result.append({
                "user_id": entry["_id"],
                "name": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or user_data.get('email', 'Anonymous'),
                "badge_count": entry["badge_count"],
                "top_badges": top_badges,
                "latest_badge_date": entry["latest_badge"]
            })
    
    return result