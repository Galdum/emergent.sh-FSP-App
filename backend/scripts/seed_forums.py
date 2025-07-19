"""
Forum Seed Data Migration Script
Seeds the database with initial forum data for the FSP Navigator application
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from settings import settings
from models import Forum, UserInDB
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# System user for creating forums
SYSTEM_USER_ID = "system"

# Seed forum data
FORUMS_DATA = [
    {
        "slug": "general-fsp-approbation",
        "title": "General FSP / Approbation",
        "description": "Discuții generale despre procesul de Approbation, FSP și sfaturi pentru medici din România care doresc să practice în Germania."
    },
    {
        "slug": "exemple-cazuri-clinice",
        "title": "Exemple de cazuri clinice",
        "description": "Prezentări de cazuri clinice pentru pregătirea FSP și KP, cu discuții despre diagnostic și tratament."
    },
    {
        "slug": "gramatica-germana",
        "title": "Întrebări de gramatică germană",
        "description": "Suport pentru învățarea limbii germane medicale, terminologie și expresii specifice domeniului medical."
    }
]

async def create_system_user(db):
    """Create system user for forum creation if it doesn't exist"""
    try:
        existing_user = await db.users.find_one({"id": SYSTEM_USER_ID})
        if not existing_user:
            from backend.models import UserInDB
            system_user = UserInDB(
                id=SYSTEM_USER_ID,
                email="system@fspnavigator.com",
                password_hash="system_user_hash",
                is_admin=True,
                subscription_tier="PREMIUM",
                first_name="System",
                last_name="User"
            )
            await db.users.insert_one(system_user.dict())
            logger.info("System user created")
        else:
            logger.info("System user already exists")
    except Exception as e:
        logger.error(f"Error creating system user: {e}")
        raise

async def seed_forums(db):
    """Seed the database with initial forum data"""
    try:
        logger.info("Starting forum data seeding...")
        
        for forum_data in FORUMS_DATA:
            # Check if forum already exists
            existing = await db.forums.find_one({"slug": forum_data["slug"]})
            if existing:
                logger.info(f"Forum '{forum_data['slug']}' already exists, skipping...")
                continue
            
            # Create forum
            forum = Forum(
                slug=forum_data["slug"],
                title=forum_data["title"],
                description=forum_data["description"],
                premium_only=True,
                created_by=SYSTEM_USER_ID
            )
            
            await db.forums.insert_one(forum.dict())
            logger.info(f"Created forum: {forum_data['title']}")
        
        # Create database indexes for better performance
        await create_indexes(db)
        
        logger.info("Forum seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"Error seeding forums: {e}")
        raise

async def create_indexes(db):
    """Create database indexes for optimal performance"""
    try:
        logger.info("Creating database indexes...")
        
        # Forum indexes
        await db.forums.create_index("slug", unique=True)
        await db.forums.create_index("is_active")
        
        # Thread indexes
        await db.threads.create_index("forum_id")
        await db.threads.create_index([("forum_id", 1), ("updated_at", -1)])
        await db.threads.create_index([("forum_id", 1), ("created_at", -1)])
        await db.threads.create_index([("forum_id", 1), ("is_pinned", -1), ("updated_at", -1)])
        
        # Comment indexes
        await db.comments.create_index("thread_id")
        await db.comments.create_index([("thread_id", 1), ("created_at", 1)])
        await db.comments.create_index([("thread_id", 1), ("parent_id", 1)])
        await db.comments.create_index("is_deleted")
        
        # Vote indexes
        await db.votes.create_index([("user_id", 1), ("target_id", 1), ("target_type", 1)], unique=True)
        await db.votes.create_index("target_id")
        await db.votes.create_index([("target_type", 1), ("target_id", 1)])
        
        logger.info("Database indexes created successfully!")
        
    except Exception as e:
        logger.warning(f"Index creation warning (non-critical): {e}")

async def main():
    """Main migration function"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.mongo_url)
        db = client[settings.db_name]
        
        # Test connection
        await client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {settings.db_name}")
        
        # Create system user
        await create_system_user(db)
        
        # Seed forums
        await seed_forums(db)
        
        # Close connection
        client.close()
        logger.info("Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())