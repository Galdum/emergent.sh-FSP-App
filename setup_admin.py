#!/usr/bin/env python3
"""
Admin Setup Script for FSP Navigator
This script initializes the first admin user with your credentials.
"""

import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from backend.auth import get_password_hash
from backend.models import User, UserInDB
from backend.database import get_database
import uvloop

# Your admin credentials
ADMIN_EMAIL = "galburdumitru1@gmail.com"
ADMIN_PASSWORD = "Anestezie130697"

async def setup_admin():
    """Initialize admin user in the database."""
    
    print("🔧 Setting up admin user...")
    
    # Connect to database
    try:
        # Use environment variables if available, otherwise use defaults
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "fsp_navigator")
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        print(f"📊 Connected to database: {db_name}")
        
        # Check if admin already exists
        existing_admin = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
        
        if existing_admin:
            # Update existing user to admin
            await db.users.update_one(
                {"email": ADMIN_EMAIL.lower()},
                {"$set": {
                    "is_admin": True,
                    "admin_granted_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
            print(f"✅ Updated existing user {ADMIN_EMAIL} to admin")
        else:
            # Create new admin user
            user = User(email=ADMIN_EMAIL.lower())
            user_in_db = UserInDB(
                **user.dict(),
                password_hash=get_password_hash(ADMIN_PASSWORD),
                is_admin=True,
                admin_granted_at=datetime.utcnow()
            )
            
            await db.users.insert_one(user_in_db.dict())
            print(f"✅ Created new admin user: {ADMIN_EMAIL}")
        
        # Verify admin was created
        admin_user = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
        if admin_user and admin_user.get("is_admin"):
            print(f"🎉 Admin setup successful!")
            print(f"📧 Email: {ADMIN_EMAIL}")
            print(f"🔑 Password: {ADMIN_PASSWORD}")
            print(f"👑 Admin status: {admin_user.get('is_admin')}")
            print(f"📅 Created: {admin_user.get('created_at')}")
            
        client.close()
        
    except Exception as e:
        print(f"❌ Error setting up admin: {e}")
        return False
    
    return True

async def main():
    """Main setup function."""
    print("🚀 FSP Navigator Admin Setup")
    print("=" * 40)
    
    success = await setup_admin()
    
    if success:
        print("\n🎯 Next steps:")
        print("1. Start your application (backend + frontend)")
        print("2. Go to your application URL")
        print("3. Login with your admin credentials")
        print("4. Click 'Admin Panel' to access admin features")
        print("\n🔧 Local development:")
        print("   Backend: cd backend && python -m uvicorn server:app --reload")
        print("   Frontend: cd frontend && npm start")
        print("\n🌐 For emergent.sh:")
        print("   Set environment variables in emergent.sh dashboard")
        print("   Deploy and access your app")
    else:
        print("\n❌ Setup failed. Please check your database connection.")

if __name__ == "__main__":
    # Use uvloop for better performance if available
    try:
        uvloop.install()
    except ImportError:
        pass
    
    asyncio.run(main())