#!/usr/bin/env python3
"""
Simple test to verify settings can be loaded.
This test doesn't require all dependencies to be installed.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to sys.path
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR.parent))

def test_settings_loading():
    """Test if settings can be loaded."""
    try:
        # Set some test environment variables
        os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
        os.environ['DB_NAME'] = 'test_db'
        os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-key-that-is-long-enough-for-testing'
        os.environ['ENCRYPTION_KEY'] = 'test-encryption-key-that-is-long-enough-for-testing'
        os.environ['ENVIRONMENT'] = 'test'
        
        # Try to import settings
        from backend.settings import settings
        
        print("✅ Settings loaded successfully!")
        print(f"   MONGO_URL: {settings.mongo_url}")
        print(f"   DB_NAME: {settings.db_name}")
        print(f"   JWT_SECRET_KEY: {'*' * len(settings.jwt_secret_key)}")
        print(f"   ENCRYPTION_KEY: {'*' * len(settings.encryption_key)}")
        print(f"   ENVIRONMENT: {settings.environment}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to load settings: {e}")
        return False


if __name__ == "__main__":
    success = test_settings_loading()
    sys.exit(0 if success else 1)