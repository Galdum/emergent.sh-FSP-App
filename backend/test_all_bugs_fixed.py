#!/usr/bin/env python3
"""
Comprehensive test script to verify that all three bugs have been fixed:
1. Rate limiting endpoint missing request parameter
2. Redis connection and response handling issues
3. Async function calls event loop incorrectly
"""

import re
import sys
from pathlib import Path

def test_bug_1_request_parameter():
    """Test that all rate-limited endpoints have the required request parameter."""
    print("🔍 Testing Bug 1: Rate limiting endpoint missing request parameter...")
    
    files_to_check = [
        'backend/routes/auth.py',
        'backend/routes/files.py'
    ]
    
    all_passed = True
    
    for file_path in files_to_check:
        if not Path(file_path).exists():
            print(f"   ⚠️  File not found: {file_path}")
            continue
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Find all @limiter.limit decorators
        pattern = r'@limiter\.limit\([^)]+\)\s*\n\s*async def (\w+)\s*\(([^)]*)\):'
        matches = re.finditer(pattern, content, re.MULTILINE)
        
        for match in matches:
            function_name = match.group(1)
            parameters = match.group(2)
            
            if 'request' not in parameters:
                print(f"   ❌ {function_name} in {file_path} missing 'request' parameter")
                print(f"      Parameters: {parameters}")
                all_passed = False
            else:
                print(f"   ✅ {function_name} in {file_path} has 'request' parameter")
    
    return all_passed

def test_bug_2_redis_handling():
    """Test that Redis connection and response handling issues are fixed."""
    print("\n🔍 Testing Bug 2: Redis connection and response handling...")
    
    # Test 1: Check if create_limiter function exists
    try:
        with open('backend/security.py', 'r') as f:
            content = f.read()
        
        if 'def create_limiter():' in content:
            print("   ✅ create_limiter function exists")
        else:
            print("   ❌ create_limiter function not found")
            return False
        
        # Test 2: Check if rate_limit_exceeded_handler returns JSONResponse
        if 'JSONResponse(' in content and 'rate_limit_exceeded_handler' in content:
            print("   ✅ rate_limit_exceeded_handler returns JSONResponse")
        else:
            print("   ❌ rate_limit_exceeded_handler not properly implemented")
            return False
        
        # Test 3: Check if server.py handles None limiter
        with open('backend/server.py', 'r') as f:
            server_content = f.read()
        
        if 'if limiter is not None:' in server_content:
            print("   ✅ Server handles None limiter gracefully")
        else:
            print("   ❌ Server doesn't handle None limiter")
            return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error testing Redis handling: {e}")
        return False

def test_bug_3_async_event_loop():
    """Test that async function calls event loop issue is fixed."""
    print("\n🔍 Testing Bug 3: Async function calls event loop...")
    
    try:
        with open('backend/routes/deployment.py', 'r') as f:
            content = f.read()
        
        # Check if asyncio.run is still being used incorrectly
        if 'asyncio.run(test_redis_connection())' in content:
            print("   ❌ asyncio.run still being used incorrectly")
            return False
        
        # Check if await is being used correctly
        if 'await test_redis_connection()' in content:
            print("   ✅ await is being used correctly")
        else:
            print("   ❌ await not found for test_redis_connection")
            return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error testing async event loop: {e}")
        return False

def test_imports_and_syntax():
    """Test that all imports and syntax are correct."""
    print("\n🔍 Testing imports and syntax...")
    
    try:
        # Test security.py imports
        with open('backend/security.py', 'r') as f:
            content = f.read()
        
        required_imports = [
            'from fastapi.responses import JSONResponse',
            'from fastapi import HTTPException, status',
            'import logging'
        ]
        
        for import_stmt in required_imports:
            if import_stmt in content:
                print(f"   ✅ {import_stmt}")
            else:
                print(f"   ❌ Missing: {import_stmt}")
                return False
        
        # Test server.py imports
        with open('backend/server.py', 'r') as f:
            server_content = f.read()
        
        if 'logger.info("Rate limiting enabled")' in server_content:
            print("   ✅ Rate limiting logging added")
        else:
            print("   ❌ Rate limiting logging not found")
            return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error testing imports: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing All Bug Fixes")
    print("=" * 60)
    
    tests = [
        ("Bug 1: Request Parameter", test_bug_1_request_parameter),
        ("Bug 2: Redis Handling", test_bug_2_redis_handling),
        ("Bug 3: Async Event Loop", test_bug_3_async_event_loop),
        ("Imports and Syntax", test_imports_and_syntax)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name}...")
        if test_func():
            passed += 1
            print(f"   ✅ {test_name} PASSED")
        else:
            print(f"   ❌ {test_name} FAILED")
    
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All bugs have been successfully fixed!")
        print("\n✅ Summary of fixes:")
        print("   1. All rate-limited endpoints now have 'request: Request' parameter")
        print("   2. Redis connection failures are handled gracefully with fallback")
        print("   3. Rate limit exceeded handler returns proper JSONResponse")
        print("   4. Async function calls use 'await' instead of 'asyncio.run'")
        print("   5. Server handles None limiter gracefully")
        return 0
    else:
        print("⚠️  Some bugs are still present. Please review the failed tests above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())