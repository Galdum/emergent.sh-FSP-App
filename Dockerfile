# Multi-stage build for React + FastAPI application
FROM node:18-alpine AS frontend-build

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --production=false
COPY frontend/ ./
RUN npm run build

# Python backend stage
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-build /frontend/build ./frontend/build

# Create a simple static file server for frontend
RUN echo 'from fastapi.staticfiles import StaticFiles\n\
import os\n\
from backend.server import app\n\
\n\
# Serve static files\n\
if os.path.exists("./frontend/build"):\n\
    app.mount("/", StaticFiles(directory="./frontend/build", html=True), name="static")\n\
\n\
if __name__ == "__main__":\n\
    import uvicorn\n\
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))' > main.py

EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

CMD ["python", "main.py"]