"""
Main entry point for the FSP Navigator application.
Serves both the FastAPI backend and React frontend static files.
"""

import os
import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.append(str(Path(__file__).parent))

from fastapi.staticfiles import StaticFiles
from backend.server import app

# Get configuration from environment
PORT = int(os.environ.get("PORT", 8000))
FRONTEND_BUILD_PATH = "./frontend/build"

# Serve React static files at root path only if build directory exists
# Mount static files at a subpath to avoid conflicts with API routes
if os.path.exists(FRONTEND_BUILD_PATH):
    # Mount static files at /static first to avoid conflicts
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_PATH), name="frontend-static")
    
    # Serve React app's index.html for all non-API routes
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        """
        Serve React app for all routes that don't start with /api or /docs
        """
        # Don't intercept API routes, docs, or static assets
        if (full_path.startswith("api/") or 
            full_path.startswith("docs") or 
            full_path.startswith("redoc") or
            full_path.startswith("openapi.json") or
            full_path.startswith("static/")):
            # This shouldn't be reached due to FastAPI routing precedence
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        
        # Serve index.html for all other routes (React Router will handle routing)
        from fastapi.responses import FileResponse
        index_path = os.path.join(FRONTEND_BUILD_PATH, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        else:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Frontend not built")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=PORT,
        reload=False,
        access_log=True
    )