#!/bin/bash

echo "🔄 Running Informatii Utile Migration Script..."

# Set required environment variables
export MONGO_URL="${MONGO_URL:-mongodb://localhost:27017}"
export DB_NAME="${DB_NAME:-approbmed}"
export JWT_SECRET_KEY="${JWT_SECRET_KEY:-your-secret-key-here}"

echo "📊 Using configuration:"
echo "   MongoDB URL: $MONGO_URL"
echo "   Database: $DB_NAME"
echo ""

# Add current directory to Python path
export PYTHONPATH="/workspace:$PYTHONPATH"

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! timeout 5 python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
async def test():
    client = AsyncIOMotorClient('$MONGO_URL')
    try:
        await client.admin.command('ping')
        print('✅ MongoDB connection successful')
    except Exception as e:
        print(f'❌ MongoDB connection failed: {e}')
        exit(1)
asyncio.run(test())
" 2>/dev/null; then
    echo "❌ MongoDB is not running or not accessible."
    echo ""
    echo "💡 To start MongoDB locally:"
    echo "   sudo systemctl start mongod"
    echo "   # OR"
    echo "   docker run -d -p 27017:27017 mongo:latest"
    echo ""
    exit 1
fi

echo ""
echo "🚀 Running migration script..."
cd /workspace
python3 scripts/migrate_util_info_docs.py

echo "✅ Migration script completed!"