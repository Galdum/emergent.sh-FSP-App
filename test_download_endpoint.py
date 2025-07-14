#!/usr/bin/env python3
"""
Simple test script to verify the download endpoint implementation.
This script tests the syntax and basic functionality without requiring a full server setup.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / "backend"))

def test_download_endpoint_syntax():
    """Test that the download endpoint can be imported and has correct syntax."""
    try:
        # Test importing the files module
        from routes.files import router, download_file
        
        print("✅ Successfully imported files module")
        print("✅ Download endpoint function exists")
        
        # Check that the router has the download route
        routes = [route.path for route in router.routes]
        download_route = "/download/{file_id}"
        
        if download_route in routes:
            print(f"✅ Download route found: {download_route}")
        else:
            print(f"❌ Download route not found. Available routes: {routes}")
            return False
        
        # Test the function signature
        import inspect
        sig = inspect.signature(download_file)
        params = list(sig.parameters.keys())
        
        expected_params = ['file_id', 'current_user', 'db']
        if all(param in params for param in expected_params):
            print(f"✅ Function signature correct: {params}")
        else:
            print(f"❌ Function signature incorrect. Expected {expected_params}, got {params}")
            return False
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_file_response_import():
    """Test that FileResponse can be imported."""
    try:
        from fastapi.responses import FileResponse
        print("✅ FileResponse import successful")
        return True
    except ImportError as e:
        print(f"❌ FileResponse import failed: {e}")
        return False

def test_upload_directory():
    """Test that the upload directory is properly configured."""
    try:
        from routes.files import UPLOAD_DIR
        print(f"✅ Upload directory configured: {UPLOAD_DIR}")
        
        # Check if directory exists or can be created
        if UPLOAD_DIR.exists():
            print(f"✅ Upload directory exists: {UPLOAD_DIR}")
        else:
            print(f"⚠️  Upload directory does not exist: {UPLOAD_DIR}")
            print("   (This is normal if no files have been uploaded yet)")
        
        return True
    except Exception as e:
        print(f"❌ Upload directory test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing Download Endpoint Implementation")
    print("=" * 50)
    
    tests = [
        ("FileResponse Import", test_file_response_import),
        ("Upload Directory", test_upload_directory),
        ("Download Endpoint Syntax", test_download_endpoint_syntax),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 30)
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nTotal: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! The download endpoint implementation is ready.")
        return True
    else:
        print("\n⚠️  Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)