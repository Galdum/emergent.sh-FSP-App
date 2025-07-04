#!/bin/bash

# FSP Navigator Backend Startup Script

echo "Starting FSP Navigator Backend Server..."

# Check if we're in the right directory
if [ ! -f "backend/server.py" ]; then
    echo "Error: Must run from project root directory"
    exit 1
fi

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "Error: backend/.env file not found"
    echo "Please copy backend/.env.example to backend/.env and configure it"
    exit 1
fi

# Load environment variables
export $(cat backend/.env | grep -v '^#' | xargs)

# Check required environment variables
required_vars=("MONGO_URL" "DB_NAME" "JWT_SECRET" "GEMINI_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Create necessary directories
mkdir -p /app/uploads
mkdir -p logs

# Check MongoDB connection
echo "Checking MongoDB connection..."
python3 -c "
import os
from pymongo import MongoClient
try:
    client = MongoClient(os.environ['MONGO_URL'])
    client.server_info()
    print('MongoDB connection successful')
except Exception as e:
    print(f'MongoDB connection failed: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo "Failed to connect to MongoDB. Please check your MONGO_URL"
    exit 1
fi

# Initialize admin user if needed
echo "Checking admin initialization..."
curl -s -X POST http://localhost:8000/api/admin/initialize-admin || true

# Start the server
echo "Starting Uvicorn server..."
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload