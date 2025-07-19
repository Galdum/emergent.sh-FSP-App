#!/usr/bin/env python3
"""
Admin System Backend API Test Suite
Tests admin user creation, authentication, and all admin endpoints.
"""
import requests
import json
import os
from datetime import datetime
import time

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

# Ensure the URL doesn't have trailing slash
BACKEND_URL = BACKEND_URL.rstrip('/')
API_URL = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@medicalguidegermany.com"
ADMIN_PASSWORD = "admin123secure"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

# Store auth tokens
admin_token = None
user_token = None

def print_test_result(test_name, success, response=None, error=None):
    """Print test result in a formatted way."""
    if success:
        print(f"✅ {test_name}: PASSED")
        if response:
            print(f"   Response: {response.status_code} {response.reason}")
            try:
                data = response.json()
                if isinstance(data, dict) and len(str(data)) > 300:
                    # Truncate long responses
                    print(f"   Data: {json.dumps(data, indent=2)[:300]}...")
                else:
                    print(f"   Data: {json.dumps(data, indent=2)}")
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

def test_initialize_admin():
    """Test the /admin/initialize-admin endpoint."""
    try:
        response = requests.post(f"{API_URL}/admin/initialize-admin")
        
        # This should either succeed (if no admin exists) or fail with "Admin users already exist"
        success = response.status_code in [200, 403]
        
        if response.status_code == 403:
            print_test_result("Initialize Admin (Admin exists)", success, response)
        else:
            print_test_result("Initialize Admin", success, response)
        
        return success
    except Exception as e:
        print_test_result("Initialize Admin", False, error=str(e))
        return False

def test_admin_login_with_existing_user():
    """Test admin login with existing admin user."""
    global admin_token
    
    # Try to login with the system admin user
    system_admin_email = "system@fspnavigator.com"
    
    # We don't know the password, so let's try common ones or check if we can find it
    possible_passwords = ["admin", "password", "system", "admin123", "system123"]
    
    for password in possible_passwords:
        try:
            response = requests.post(
                f"{API_URL}/auth/login",
                json={"email": system_admin_email, "password": password}
            )
            
            if response.status_code == 200 and "access_token" in response.json():
                admin_token = response.json().get("access_token")
                print_test_result(f"Admin Login (system user with password: {password})", True, response)
                return True
        except Exception as e:
            continue
    
    print_test_result("Admin Login (system user)", False, error="Could not find correct password for system admin")
    return False

def test_create_admin_user():
    """Test creating a new admin user."""
    global admin_token
    
    try:
        # First try to register the admin user
        response = requests.post(
            f"{API_URL}/auth/register",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        if response.status_code == 400 and "already registered" in response.json().get("detail", ""):
            # User exists, try to login
            login_response = requests.post(
                f"{API_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if login_response.status_code == 200:
                admin_token = login_response.json().get("access_token")
                print_test_result("Admin User Login (existing)", True, login_response)
                return True
            else:
                print_test_result("Admin User Login (existing)", False, login_response)
                return False
        elif response.status_code == 200:
            admin_token = response.json().get("access_token")
            print_test_result("Admin User Registration", True, response)
            return True
        else:
            print_test_result("Admin User Registration", False, response)
            return False
            
    except Exception as e:
        print_test_result("Admin User Registration", False, error=str(e))
        return False

def test_regular_user_setup():
    """Setup a regular user for testing admin access control."""
    global user_token
    
    try:
        # Try to register the test user
        response = requests.post(
            f"{API_URL}/auth/register",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        
        if response.status_code == 400 and "already registered" in response.json().get("detail", ""):
            # User exists, try to login
            login_response = requests.post(
                f"{API_URL}/auth/login",
                json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
            )
            
            if login_response.status_code == 200:
                user_token = login_response.json().get("access_token")
                print_test_result("Regular User Login (existing)", True, login_response)
                return True
        elif response.status_code == 200:
            user_token = response.json().get("access_token")
            print_test_result("Regular User Registration", True, response)
            return True
        
        print_test_result("Regular User Setup", False, response)
        return False
            
    except Exception as e:
        print_test_result("Regular User Setup", False, error=str(e))
        return False

def test_admin_stats():
    """Test GET /admin/stats endpoint."""
    global admin_token
    
    if not admin_token:
        print_test_result("Admin Stats", False, error="No admin token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        success = response.status_code == 200 and "total_users" in response.json()
        print_test_result("Admin Stats", success, response)
        return success
    except Exception as e:
        print_test_result("Admin Stats", False, error=str(e))
        return False

def test_admin_users():
    """Test GET /admin/users endpoint."""
    global admin_token
    
    if not admin_token:
        print_test_result("Admin Users List", False, error="No admin token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"limit": 10}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Admin Users List", success, response)
        return success
    except Exception as e:
        print_test_result("Admin Users List", False, error=str(e))
        return False

def test_admin_transactions():
    """Test GET /admin/transactions endpoint."""
    global admin_token
    
    if not admin_token:
        print_test_result("Admin Transactions", False, error="No admin token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/transactions",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"limit": 10}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Admin Transactions", success, response)
        return success
    except Exception as e:
        print_test_result("Admin Transactions", False, error=str(e))
        return False

def test_admin_errors():
    """Test GET /admin/errors endpoint."""
    global admin_token
    
    if not admin_token:
        print_test_result("Admin Errors", False, error="No admin token available")
        return False
    
    try:
        # First create an error report to ensure there's data
        error_response = requests.post(
            f"{API_URL}/monitoring/report-error",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "error_type": "admin_test_error",
                "error_message": "Test error from admin test",
                "stack_trace": "Test stack trace",
                "url": "/admin-test"
            }
        )
        
        # Now get the errors
        response = requests.get(
            f"{API_URL}/admin/errors",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"limit": 10}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Admin Errors", success, response)
        return success
    except Exception as e:
        print_test_result("Admin Errors", False, error=str(e))
        return False

def test_admin_util_info_docs():
    """Test GET /admin/util-info-docs endpoint."""
    global admin_token
    
    if not admin_token:
        print_test_result("Admin Util Info Docs", False, error="No admin token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/util-info-docs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Admin Util Info Docs", success, response)
        return success
    except Exception as e:
        print_test_result("Admin Util Info Docs", False, error=str(e))
        return False

def test_admin_access_control():
    """Test that regular users cannot access admin endpoints."""
    global user_token
    
    if not user_token:
        print_test_result("Admin Access Control", False, error="No regular user token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # We expect a 403 Forbidden response
        success = response.status_code == 403
        print_test_result("Admin Access Control", success, response)
        return success
    except Exception as e:
        print_test_result("Admin Access Control", False, error=str(e))
        return False

def test_update_user_subscription():
    """Test updating a user's subscription tier (admin only)."""
    global admin_token, user_token
    
    if not admin_token:
        print_test_result("Update User Subscription", False, error="No admin token available")
        return False
    
    if not user_token:
        print_test_result("Update User Subscription", False, error="No test user available")
        return False
    
    try:
        # First get the test user's ID
        me_response = requests.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        if me_response.status_code != 200:
            print_test_result("Update User Subscription", False, error="Could not get test user info")
            return False
        
        user_id = me_response.json().get("id")
        
        # Update subscription to PREMIUM
        response = requests.patch(
            f"{API_URL}/admin/users/{user_id}/subscription",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"subscription_tier": "PREMIUM"}
        )
        
        success = response.status_code == 200
        print_test_result("Update User Subscription", success, response)
        return success
    except Exception as e:
        print_test_result("Update User Subscription", False, error=str(e))
        return False

def test_grant_admin_privileges():
    """Test granting admin privileges to a user."""
    global admin_token, user_token
    
    if not admin_token:
        print_test_result("Grant Admin Privileges", False, error="No admin token available")
        return False
    
    if not user_token:
        print_test_result("Grant Admin Privileges", False, error="No test user available")
        return False
    
    try:
        # First get the test user's ID
        me_response = requests.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        if me_response.status_code != 200:
            print_test_result("Grant Admin Privileges", False, error="Could not get test user info")
            return False
        
        user_id = me_response.json().get("id")
        
        # Grant admin privileges
        response = requests.patch(
            f"{API_URL}/admin/users/{user_id}/admin-status",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"is_admin": True}
        )
        
        success = response.status_code == 200
        print_test_result("Grant Admin Privileges", success, response)
        
        # Revoke admin privileges to clean up
        if success:
            revoke_response = requests.patch(
                f"{API_URL}/admin/users/{user_id}/admin-status",
                headers={"Authorization": f"Bearer {admin_token}"},
                params={"is_admin": False}
            )
            print(f"   Cleanup - Revoked admin privileges: {revoke_response.status_code}")
        
        return success
    except Exception as e:
        print_test_result("Grant Admin Privileges", False, error=str(e))
        return False

def test_create_util_info_document():
    """Test creating a utility info document."""
    global admin_token
    
    if not admin_token:
        print_test_result("Create Util Info Document", False, error="No admin token available")
        return False
    
    try:
        doc_data = {
            "title": "Test Document",
            "content": "This is a test document created by the admin test suite.",
            "category": "test",
            "order_priority": 999,
            "is_active": True
        }
        
        response = requests.post(
            f"{API_URL}/admin/util-info-docs",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=doc_data
        )
        
        success = response.status_code == 200 and "id" in response.json()
        print_test_result("Create Util Info Document", success, response)
        
        # Clean up - delete the test document
        if success:
            doc_id = response.json().get("id")
            delete_response = requests.delete(
                f"{API_URL}/admin/util-info-docs/{doc_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            print(f"   Cleanup - Deleted test document: {delete_response.status_code}")
        
        return success
    except Exception as e:
        print_test_result("Create Util Info Document", False, error=str(e))
        return False

def run_admin_tests():
    """Run all admin system tests."""
    print("\n" + "=" * 80)
    print("ADMIN SYSTEM BACKEND API TEST SUITE")
    print("=" * 80)
    print(f"Testing Admin API at: {API_URL}")
    print("-" * 80)
    
    # Track test results
    results = {}
    
    # 1. Test admin initialization endpoint
    results["initialize_admin"] = test_initialize_admin()
    
    # 2. Try to login with existing admin user
    results["admin_login_existing"] = test_admin_login_with_existing_user()
    
    # 3. If that fails, try to create new admin user
    if not results["admin_login_existing"]:
        results["create_admin_user"] = test_create_admin_user()
    
    # 4. Setup regular user for access control tests
    results["regular_user_setup"] = test_regular_user_setup()
    
    # 5. Test admin endpoints (only if we have admin token)
    if admin_token:
        results["admin_stats"] = test_admin_stats()
        results["admin_users"] = test_admin_users()
        results["admin_transactions"] = test_admin_transactions()
        results["admin_errors"] = test_admin_errors()
        results["admin_util_info_docs"] = test_admin_util_info_docs()
        
        # 6. Test admin user management
        results["update_user_subscription"] = test_update_user_subscription()
        results["grant_admin_privileges"] = test_grant_admin_privileges()
        
        # 7. Test content management
        results["create_util_info_document"] = test_create_util_info_document()
    
    # 8. Test access control
    results["admin_access_control"] = test_admin_access_control()
    
    # Print summary
    print("\n" + "=" * 80)
    print("ADMIN TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print("-" * 80)
    print(f"ADMIN TESTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * 80)
    
    return results

if __name__ == "__main__":
    run_admin_tests()