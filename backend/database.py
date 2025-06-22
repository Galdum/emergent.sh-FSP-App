from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def get_database():
    """Dependency to get database instance."""
    return db

async def init_database():
    """Initialize database with indexes."""
    # Create indexes for better performance
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.user_progress.create_index("user_id")
    await db.personal_files.create_index("user_id")
    print("Database indexes created successfully")