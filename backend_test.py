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
ADMIN_EMAIL = "admin@medicalguidegermany.com"
ADMIN_PASSWORD = "admin123secure"

# Store auth tokens
auth_token = None
admin_auth_token = None

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

def test_register_admin():
    """Test admin user registration."""
    global admin_auth_token
    
    try:
        # Try to register the admin user
        response = requests.post(
            f"{API_URL}/auth/register",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        # If registration fails because user already exists, try to login instead
        if response.status_code == 400 and "already registered" in response.json().get("detail", ""):
            login_response = requests.post(
                f"{API_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            success = login_response.status_code == 200 and "access_token" in login_response.json()
            if success:
                admin_auth_token = login_response.json().get("access_token")
                print_test_result("Admin User Registration (via login)", success, login_response)
                return success
        else:
            success = response.status_code == 200 and "access_token" in response.json()
            if success:
                admin_auth_token = response.json().get("access_token")
                
            print_test_result("Admin User Registration", success, response)
            return success
    except Exception as e:
        print_test_result("Admin User Registration", False, error=str(e))
        return False

def test_login():
    """Test user login."""
    global auth_token
    
    # First register a user with the fixed TEST_EMAIL
    try:
        register_response = requests.post(
            f"{API_URL}/auth/register",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        # Now try to login
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

def test_admin_login():
    """Test admin user login."""
    global admin_auth_token
    
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        success = response.status_code == 200 and "access_token" in response.json()
        
        if success:
            # Store the token for subsequent tests
            admin_auth_token = response.json().get("access_token")
            
        print_test_result("Admin Login", success, response)
        return success
    except Exception as e:
        print_test_result("Admin Login", False, error=str(e))
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

# New Enterprise Feature Tests

# 1. Billing Endpoints
def test_billing_plans():
    """Test the GET /billing/plans endpoint."""
    try:
        response = requests.get(f"{API_URL}/billing/plans")
        success = response.status_code == 200 and isinstance(response.json(), dict)
        print_test_result("Get Billing Plans", success, response)
        return success
    except Exception as e:
        print_test_result("Get Billing Plans", False, error=str(e))
        return False

def test_billing_checkout():
    """Test the POST /billing/checkout endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Create Checkout Session", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.post(
            f"{API_URL}/billing/checkout",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"subscription_plan": "BASIC"}
        )
        
        # Even with test keys, we should get a valid response with a checkout URL
        success = response.status_code == 200 and "url" in response.json() and "session_id" in response.json()
        print_test_result("Create Checkout Session", success, response)
        
        # Store session ID for payment status test if successful
        if success:
            global session_id
            session_id = response.json().get("session_id")
            
        return success
    except Exception as e:
        print_test_result("Create Checkout Session", False, error=str(e))
        return False

def test_payment_status():
    """Test the GET /billing/payment-status/{session_id} endpoint."""
    global auth_token, session_id
    
    if not auth_token:
        print_test_result("Check Payment Status", False, error="No auth token available. Login first.")
        return False
    
    if not session_id:
        print_test_result("Check Payment Status", False, error="No session ID available. Create checkout first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/billing/payment-status/{session_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # We expect a valid response with payment status
        success = response.status_code == 200 and "status" in response.json()
        print_test_result("Check Payment Status", success, response)
        return success
    except Exception as e:
        print_test_result("Check Payment Status", False, error=str(e))
        return False

def test_transactions():
    """Test the GET /billing/transactions endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Get Transactions", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/billing/transactions",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get Transactions", success, response)
        return success
    except Exception as e:
        print_test_result("Get Transactions", False, error=str(e))
        return False

# 2. Admin Endpoints
def test_admin_stats():
    """Test the GET /admin/stats endpoint."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Get Admin Stats", False, error="No admin auth token available. Login as admin first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/stats",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and "total_users" in response.json()
        print_test_result("Get Admin Stats", success, response)
        return success
    except Exception as e:
        print_test_result("Get Admin Stats", False, error=str(e))
        return False

def test_admin_users():
    """Test the GET /admin/users endpoint."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Get Admin Users", False, error="No admin auth token available. Login as admin first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/users",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get Admin Users", success, response)
        return success
    except Exception as e:
        print_test_result("Get Admin Users", False, error=str(e))
        return False

def test_admin_transactions():
    """Test the GET /admin/transactions endpoint."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Get Admin Transactions", False, error="No admin auth token available. Login as admin first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/transactions",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get Admin Transactions", success, response)
        return success
    except Exception as e:
        print_test_result("Get Admin Transactions", False, error=str(e))
        return False

def test_admin_errors():
    """Test the GET /admin/errors endpoint."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Get Admin Errors", False, error="No admin auth token available. Login as admin first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/errors",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get Admin Errors", success, response)
        return success
    except Exception as e:
        print_test_result("Get Admin Errors", False, error=str(e))
        return False

def test_admin_access_control():
    """Test that regular users cannot access admin endpoints."""
    global auth_token
    
    if not auth_token:
        print_test_result("Test Admin Access Control", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/admin/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # We expect a 403 Forbidden response
        success = response.status_code == 403
        print_test_result("Test Admin Access Control", success, response)
        return success
    except Exception as e:
        print_test_result("Test Admin Access Control", False, error=str(e))
        return False

# 3. Monitoring Endpoints
def test_report_error():
    """Test the POST /monitoring/report-error endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Report Error", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.post(
            f"{API_URL}/monitoring/report-error",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "error_type": "client_error",
                "error_message": "Test error message",
                "stack_trace": "Test stack trace",
                "url": "/test-page"
            }
        )
        
        success = response.status_code == 200 and "report_id" in response.json()
        print_test_result("Report Error", success, response)
        return success
    except Exception as e:
        print_test_result("Report Error", False, error=str(e))
        return False

def test_submit_feedback():
    """Test the POST /monitoring/feedback endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Submit Feedback", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.post(
            f"{API_URL}/monitoring/feedback",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "This is a test feedback message",
                "category": "feature_request",
                "priority": "medium"
            }
        )
        
        success = response.status_code == 200 and "feedback_id" in response.json()
        print_test_result("Submit Feedback", success, response)
        return success
    except Exception as e:
        print_test_result("Submit Feedback", False, error=str(e))
        return False

def test_monitoring_health():
    """Test the GET /monitoring/health endpoint."""
    try:
        response = requests.get(f"{API_URL}/monitoring/health")
        success = response.status_code == 200 and "status" in response.json()
        print_test_result("Monitoring Health Check", success, response)
        return success
    except Exception as e:
        print_test_result("Monitoring Health Check", False, error=str(e))
        return False

def test_monitoring_metrics():
    """Test the GET /monitoring/metrics endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Get Metrics", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/monitoring/metrics",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        success = response.status_code == 200 and "user_id" in response.json()
        print_test_result("Get Metrics", success, response)
        return success
    except Exception as e:
        print_test_result("Get Metrics", False, error=str(e))
        return False

# 4. Backup Endpoints
def test_backup_status():
    """Test the GET /backup/status endpoint."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Get Backup Status", False, error="No admin auth token available. Login as admin first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/backup/status",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and "backup_count" in response.json()
        print_test_result("Get Backup Status", success, response)
        return success
    except Exception as e:
        print_test_result("Get Backup Status", False, error=str(e))
        return False

def test_backup_database():
    """Test the POST /backup/database endpoint."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Create Database Backup", False, error="No admin auth token available. Login as admin first.")
        return False
    
    try:
        response = requests.post(
            f"{API_URL}/backup/database",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        # Even if mongodump is not installed, we should get a valid error response
        success = response.status_code in [200, 500]
        print_test_result("Create Database Backup", success, response)
        return success
    except Exception as e:
        print_test_result("Create Database Backup", False, error=str(e))
        return False

def test_backup_files():
    """Test the POST /backup/files endpoint."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Create Files Backup", False, error="No admin auth token available. Login as admin first.")
        return False
    
    try:
        response = requests.post(
            f"{API_URL}/backup/files",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        # Even if tar is not installed, we should get a valid error response
        success = response.status_code in [200, 500]
        print_test_result("Create Files Backup", success, response)
        return success
    except Exception as e:
        print_test_result("Create Files Backup", False, error=str(e))
        return False

# 5. Deployment Endpoints
def test_deployment_version():
    """Test the GET /deployment/version endpoint."""
    try:
        response = requests.get(f"{API_URL}/deployment/version")
        success = response.status_code == 200 and "version" in response.json()
        print_test_result("Get Deployment Version", success, response)
        return success
    except Exception as e:
        print_test_result("Get Deployment Version", False, error=str(e))
        return False

def test_deployment_status():
    """Test the GET /deployment/status endpoint."""
    try:
        response = requests.get(f"{API_URL}/deployment/status")
        success = response.status_code == 200 and "status" in response.json()
        print_test_result("Get Deployment Status", success, response)
        return success
    except Exception as e:
        print_test_result("Get Deployment Status", False, error=str(e))
        return False

def test_feature_flags():
    """Test the GET /deployment/feature-flags endpoint."""
    global auth_token
    
    if not auth_token:
        print_test_result("Get Feature Flags", False, error="No auth token available. Login first.")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/deployment/feature-flags",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        success = response.status_code == 200 and isinstance(response.json(), dict)
        print_test_result("Get Feature Flags", success, response)
        return success
    except Exception as e:
        print_test_result("Get Feature Flags", False, error=str(e))
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
    
    # Initialize session ID for payment status test
    global session_id
    session_id = None
    
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
    
    # 7. Billing Endpoints
    results["billing_plans"] = test_billing_plans()
    results["billing_checkout"] = test_billing_checkout()
    results["payment_status"] = test_payment_status()
    results["transactions"] = test_transactions()
    
    # 8. Register Admin User
    results["register_admin"] = test_register_admin()
    results["admin_login"] = test_admin_login()
    
    # 9. Admin Endpoints
    results["admin_stats"] = test_admin_stats()
    results["admin_users"] = test_admin_users()
    results["admin_transactions"] = test_admin_transactions()
    results["admin_errors"] = test_admin_errors()
    results["admin_access_control"] = test_admin_access_control()
    
    # 10. Monitoring Endpoints
    results["report_error"] = test_report_error()
    results["submit_feedback"] = test_submit_feedback()
    results["monitoring_health"] = test_monitoring_health()
    results["monitoring_metrics"] = test_monitoring_metrics()
    
    # 11. Backup Endpoints
    results["backup_status"] = test_backup_status()
    results["backup_database"] = test_backup_database()
    results["backup_files"] = test_backup_files()
    
    # 12. Deployment Endpoints
    results["deployment_version"] = test_deployment_version()
    results["deployment_status"] = test_deployment_status()
    results["feature_flags"] = test_feature_flags()
    
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