#!/usr/bin/env python3
import requests
import json
import os
from datetime import datetime
import time
import random
import string

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

# Ensure the URL doesn't have trailing slash
BACKEND_URL = BACKEND_URL.rstrip('/')
API_URL = f"{BACKEND_URL}/api"

# Test user credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

# Store auth token
auth_token = None

def random_string(length=8):
    """Generate a random string for testing."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def print_test_result(test_name, success, response=None, error=None):
    """Print test result in a formatted way."""
    if success:
        print(f"✅ {test_name}: PASSED")
        if response:
            print(f"   Response: {response.status_code} {response.reason}")
            try:
                print(f"   Data: {json.dumps(response.json(), indent=2)[:200]}...")
            except:
                print(f"   Data: {response.text[:200]}...")
    else:
        print(f"❌ {test_name}: FAILED")
        if error:
            print(f"   Error: {error}")
        if response:
            print(f"   Response: {response.status_code} {response.reason}")
            try:
                print(f"   Data: {json.dumps(response.json(), indent=2)}")
            except:
                print(f"   Data: {response.text[:200]}...")
    print("-" * 80)

def test_health_check():
    """Test the health check endpoint."""
    try:
        response = requests.get(f"{API_URL}/health")
        success = response.status_code == 200 and response.json().get("status") == "healthy"
        print_test_result("Health Check", success, response)
        return success
    except Exception as e:
        print_test_result("Health Check", False, error=str(e))
        return False

def test_register():
    """Test user registration."""
    global auth_token
    
    # Generate a unique email to avoid conflicts
    unique_email = f"test_{random_string()}@example.com"
    
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json={"email": unique_email, "password": TEST_PASSWORD}
        )
        
        success = response.status_code == 200 and "access_token" in response.json()
        
        if success:
            # Store the token for subsequent tests
            auth_token = response.json().get("access_token")
            
        print_test_result("User Registration", success, response)
        return success
    except Exception as e:
        print_test_result("User Registration", False, error=str(e))
        return False

def test_login():
    """Test user login."""
    global auth_token
    
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        success = response.status_code == 200 and "access_token" in response.json()
        
        if success:
            # Store the token for subsequent tests
            auth_token = response.json().get("access_token")
            
        print_test_result("User Login", success, response)
        return success
    except Exception as e:
        print_test_result("User Login", False, error=str(e))
        return False

def test_me():
    """Test the protected /me endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Get Current User", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        success = response.status_code == 200 and "email" in response.json()
        print_test_result("Get Current User", success, response)
        return success
    except Exception as e:
        print_test_result("Get Current User", False, error=str(e))
        return False

def test_status_get():
    """Test the GET /status endpoint."""
    try:
        response = requests.get(f"{API_URL}/status")
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get Status Checks", success, response)
        return success
    except Exception as e:
        print_test_result("Get Status Checks", False, error=str(e))
        return False

def test_status_post():
    """Test the POST /status endpoint."""
    try:
        response = requests.post(
            f"{API_URL}/status",
            json={"client_name": f"Test Client {random_string()}"}
        )
        
        success = response.status_code == 200 and "id" in response.json()
        print_test_result("Create Status Check", success, response)
        return success
    except Exception as e:
        print_test_result("Create Status Check", False, error=str(e))
        return False

def test_progress_get():
    """Test the GET /progress endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Get User Progress", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/progress/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        success = response.status_code == 200 and "steps" in response.json()
        print_test_result("Get User Progress", success, response)
        return success
    except Exception as e:
        print_test_result("Get User Progress", False, error=str(e))
        return False

def test_progress_update():
    """Test the PUT /progress endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Update Progress", False, error="No auth token available. Login first.")
        return False
    
    try:
        # Update progress for step 1, task 1
        response = requests.put(
            f"{API_URL}/progress/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "step_id": 1,
                "task_id": 1,
                "completed": True,
                "viewed": True
            }
        )
        
        success = response.status_code == 200 and response.json().get("message") == "Progress updated successfully"
        print_test_result("Update Progress", success, response)
        return success
    except Exception as e:
        print_test_result("Update Progress", False, error=str(e))
        return False

def test_files_get():
    """Test the GET /files endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Get Personal Files", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/files/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get Personal Files", success, response)
        return success
    except Exception as e:
        print_test_result("Get Personal Files", False, error=str(e))
        return False

def test_files_create():
    """Test the POST /files endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Create Personal File", False, error="No auth token available. Login first.")
        return False
    
    try:
        # Create a note
        response = requests.post(
            f"{API_URL}/files/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "note",
                "title": f"Test Note {random_string()}",
                "content": "This is a test note created by the automated test script."
            }
        )
        
        success = response.status_code == 200 and "id" in response.json()
        print_test_result("Create Personal File", success, response)
        return success
    except Exception as e:
        print_test_result("Create Personal File", False, error=str(e))
        return False

def test_subscription_get():
    """Test the GET /subscription endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Get Subscription Info", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/subscription/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        success = response.status_code == 200 and "subscription_tier" in response.json()
        print_test_result("Get Subscription Info", success, response)
        return success
    except Exception as e:
        print_test_result("Get Subscription Info", False, error=str(e))
        return False

def run_all_tests():
    """Run all tests and return a summary."""
    print("\n" + "=" * 80)
    print("MEDICAL LICENSING GUIDE API TEST SUITE")
    print("=" * 80)
    print(f"Testing API at: {API_URL}")
    print("-" * 80)
    
    # Track test results
    results = {}
    
    # 1. Health Check
    results["health_check"] = test_health_check()
    
    # 2. Authentication Flow
    results["register"] = test_register()
    results["login"] = test_login()
    results["me"] = test_me()
    
    # 3. Legacy Endpoints
    results["status_get"] = test_status_get()
    results["status_post"] = test_status_post()
    
    # 4. Progress Management
    results["progress_get"] = test_progress_get()
    results["progress_update"] = test_progress_update()
    
    # 5. Personal Files
    results["files_get"] = test_files_get()
    results["files_create"] = test_files_create()
    
    # 6. Subscription
    results["subscription_get"] = test_subscription_get()
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print("-" * 80)
    print(f"TOTAL: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * 80)
    
    return results

if __name__ == "__main__":
    run_all_tests()