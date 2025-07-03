#!/bin/bash

# ApprobMed Startup Script
echo "🚀 Starting ApprobMed Application..."

# Start Backend
echo "📡 Starting Backend API server..."
cd backend
python -m uvicorn server:app --reload --port 8001 --host 0.0.0.0 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo "💻 Starting Frontend development server..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ ApprobMed is starting up!"
echo ""
echo "🌐 Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8001"
echo "   API Documentation: http://localhost:8001/docs"
echo ""
echo "📝 To stop the application:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🎉 ApprobMed is ready for Romanian doctors seeking German medical licenses!"

# Keep script running
wait