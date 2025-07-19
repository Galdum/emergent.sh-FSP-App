#!/usr/bin/env python3
"""
Test script to verify MongoDB connection.
Returns 'pong' only when MongoDB connection succeeds.
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to sys.path
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR.parent))

from backend.settings import settings
from motor.motor_asyncio import AsyncIOMotorClient


async def test_mongodb_connection():
    """Test MongoDB connection and return 'pong' if successful."""
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(settings.mongo_url)
        
        # Test connection with ping command
        await client.admin.command('ping')
        
        # Get database
        db = client[settings.db_name]
        
        # Test database access
        await db.list_collection_names()
        
        # Close connection
        client.close()
        
        print("pong")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_mongodb_connection())
    sys.exit(0 if success else 1)