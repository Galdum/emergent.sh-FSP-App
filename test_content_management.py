#!/usr/bin/env python3
"""
Content Management System API Test Suite
Focused testing for the new CMS backend API
"""
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

# Admin credentials for content management
ADMIN_EMAIL = "system@fspnavigator.com"
ADMIN_PASSWORD = "admin123secure"

# Store auth tokens
admin_auth_token = None

# Store content management test data
test_node_id = "step1"
test_preview_id = None
test_file_id = None

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
                data = response.json()
                if isinstance(data, dict) and len(str(data)) > 300:
                    # Show only key fields for large responses
                    key_fields = {}
                    for key in ['message', 'id', 'node_id', 'title', 'version', 'file_id', 'preview_id']:
                        if key in data:
                            key_fields[key] = data[key]
                    print(f"   Key Data: {json.dumps(key_fields, indent=2)}")
                else:
                    print(f"   Data: {json.dumps(data, indent=2)[:300]}...")
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

def test_content_admin_auth():
    """Test admin authentication for content management."""
    global admin_auth_token
    
    try:
        # Try to login with admin credentials
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        success = response.status_code == 200 and "access_token" in response.json()
        
        if success:
            admin_auth_token = response.json().get("access_token")
            
        print_test_result("Content Admin Authentication", success, response)
        return success
    except Exception as e:
        print_test_result("Content Admin Authentication", False, error=str(e))
        return False

def test_content_nodes_list():
    """Test GET /content/nodes - List all node content."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("List Node Content", False, error="No admin auth token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/content/nodes",
            headers={"Authorization": f"Bearer {admin_auth_token}"},
            params={"page": 1, "per_page": 10}
        )
        
        success = response.status_code == 200 and "contents" in response.json()
        print_test_result("List Node Content", success, response)
        return success
    except Exception as e:
        print_test_result("List Node Content", False, error=str(e))
        return False

def test_content_node_get():
    """Test GET /content/nodes/{node_id} - Get specific node content."""
    global admin_auth_token, test_node_id
    
    if not admin_auth_token:
        print_test_result("Get Node Content", False, error="No admin auth token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/content/nodes/{test_node_id}",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and "node_id" in response.json()
        print_test_result("Get Node Content", success, response)
        return success
    except Exception as e:
        print_test_result("Get Node Content", False, error=str(e))
        return False

def test_content_node_update():
    """Test PUT /content/nodes/{node_id} - Update node content."""
    global admin_auth_token, test_node_id
    
    if not admin_auth_token:
        print_test_result("Update Node Content", False, error="No admin auth token available")
        return False
    
    try:
        update_data = {
            "title": f"Updated Test Node {random_string()}",
            "description": "This is an updated test node for content management testing.",
            "blocks": [
                {
                    "type": "text",
                    "content": {"text": "This is a test text block"},
                    "position": 0
                },
                {
                    "type": "divider",
                    "content": {},
                    "position": 1
                }
            ]
        }
        
        response = requests.put(
            f"{API_URL}/content/nodes/{test_node_id}",
            headers={"Authorization": f"Bearer {admin_auth_token}"},
            json=update_data
        )
        
        success = response.status_code == 200 and "message" in response.json()
        print_test_result("Update Node Content", success, response)
        return success
    except Exception as e:
        print_test_result("Update Node Content", False, error=str(e))
        return False

def test_content_preview_create():
    """Test POST /content/nodes/{node_id}/preview - Create preview."""
    global admin_auth_token, test_node_id, test_preview_id
    
    if not admin_auth_token:
        print_test_result("Create Content Preview", False, error="No admin auth token available")
        return False
    
    try:
        # First get the current content to create a preview
        get_response = requests.get(
            f"{API_URL}/content/nodes/{test_node_id}",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        if get_response.status_code != 200:
            print_test_result("Create Content Preview", False, error="Could not get current content")
            return False
        
        current_content = get_response.json()
        
        preview_data = {
            "content_id": current_content["id"],
            "changes": {
                "title": f"Preview Test Title {random_string()}",
                "description": "This is a preview of changes to the content."
            },
            "preview_duration_hours": 24
        }
        
        response = requests.post(
            f"{API_URL}/content/nodes/{test_node_id}/preview",
            headers={"Authorization": f"Bearer {admin_auth_token}"},
            json=preview_data
        )
        
        success = response.status_code == 200 and "preview_id" in response.json()
        if success:
            test_preview_id = response.json().get("preview_id")
            
        print_test_result("Create Content Preview", success, response)
        return success
    except Exception as e:
        print_test_result("Create Content Preview", False, error=str(e))
        return False

def test_content_preview_get():
    """Test GET /content/nodes/{node_id}/preview/{preview_id} - Get preview."""
    global admin_auth_token, test_node_id, test_preview_id
    
    if not admin_auth_token:
        print_test_result("Get Content Preview", False, error="No admin auth token available")
        return False
    
    if not test_preview_id:
        print_test_result("Get Content Preview", False, error="No preview ID available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/content/nodes/{test_node_id}/preview/{test_preview_id}",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and "preview_content" in response.json()
        print_test_result("Get Content Preview", success, response)
        return success
    except Exception as e:
        print_test_result("Get Content Preview", False, error=str(e))
        return False

def test_content_file_upload():
    """Test POST /content/upload - Upload file."""
    global admin_auth_token, test_file_id
    
    if not admin_auth_token:
        print_test_result("Upload Content File", False, error="No admin auth token available")
        return False
    
    try:
        # Create a test file
        test_content = b"This is a test file for content management"
        
        files = {
            'file': ('test_document.txt', test_content, 'text/plain')
        }
        data = {
            'content_type': 'document'
        }
        
        response = requests.post(
            f"{API_URL}/content/upload",
            headers={"Authorization": f"Bearer {admin_auth_token}"},
            files=files,
            data=data
        )
        
        success = response.status_code == 200 and "file_id" in response.json()
        if success:
            test_file_id = response.json().get("file_id")
            
        print_test_result("Upload Content File", success, response)
        return success
    except Exception as e:
        print_test_result("Upload Content File", False, error=str(e))
        return False

def test_content_file_serve():
    """Test GET /content/files/{file_id} - Serve uploaded file."""
    global test_file_id
    
    if not test_file_id:
        print_test_result("Serve Content File", False, error="No file ID available")
        return False
    
    try:
        response = requests.get(f"{API_URL}/content/files/{test_file_id}")
        
        success = response.status_code == 200 and len(response.content) > 0
        print_test_result("Serve Content File", success, response)
        return success
    except Exception as e:
        print_test_result("Serve Content File", False, error=str(e))
        return False

def test_content_preview_publish():
    """Test POST /content/previews/{preview_id}/publish - Publish preview."""
    global admin_auth_token, test_preview_id
    
    if not admin_auth_token:
        print_test_result("Publish Content Preview", False, error="No admin auth token available")
        return False
    
    if not test_preview_id:
        print_test_result("Publish Content Preview", False, error="No preview ID available")
        return False
    
    try:
        publish_data = {
            "preview_id": test_preview_id,
            "change_description": "Published test preview changes"
        }
        
        response = requests.post(
            f"{API_URL}/content/previews/{test_preview_id}/publish",
            headers={"Authorization": f"Bearer {admin_auth_token}"},
            json=publish_data
        )
        
        success = response.status_code == 200 and "message" in response.json()
        print_test_result("Publish Content Preview", success, response)
        
        # Clear preview ID since it's been published
        if success:
            test_preview_id = None
            
        return success
    except Exception as e:
        print_test_result("Publish Content Preview", False, error=str(e))
        return False

def test_content_versions():
    """Test GET /content/nodes/{node_id}/versions - Get version history."""
    global admin_auth_token, test_node_id
    
    if not admin_auth_token:
        print_test_result("Get Content Versions", False, error="No admin auth token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/content/nodes/{test_node_id}/versions",
            headers={"Authorization": f"Bearer {admin_auth_token}"},
            params={"page": 1, "per_page": 5}
        )
        
        success = response.status_code == 200 and "versions" in response.json()
        print_test_result("Get Content Versions", success, response)
        return success
    except Exception as e:
        print_test_result("Get Content Versions", False, error=str(e))
        return False

def test_content_revert():
    """Test POST /content/nodes/{node_id}/revert/{version_number} - Revert to version."""
    global admin_auth_token, test_node_id
    
    if not admin_auth_token:
        print_test_result("Revert Content Version", False, error="No admin auth token available")
        return False
    
    try:
        # First get versions to find one to revert to
        versions_response = requests.get(
            f"{API_URL}/content/nodes/{test_node_id}/versions",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        if versions_response.status_code != 200:
            print_test_result("Revert Content Version", False, error="Could not get versions")
            return False
        
        versions_data = versions_response.json()
        if not versions_data.get("versions"):
            print_test_result("Revert Content Version", False, error="No versions available to revert to")
            return False
        
        # Try to revert to the first available version
        version_to_revert = versions_data["versions"][0]["version_number"]
        
        response = requests.post(
            f"{API_URL}/content/nodes/{test_node_id}/revert/{version_to_revert}",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and "message" in response.json()
        print_test_result("Revert Content Version", success, response)
        return success
    except Exception as e:
        print_test_result("Revert Content Version", False, error=str(e))
        return False

def test_content_notifications():
    """Test GET /content/notifications - Get real-time notifications."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Get Content Notifications", False, error="No admin auth token available")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/content/notifications",
            headers={"Authorization": f"Bearer {admin_auth_token}"},
            params={"limit": 10}
        )
        
        success = response.status_code == 200 and "notifications" in response.json()
        print_test_result("Get Content Notifications", success, response)
        return success
    except Exception as e:
        print_test_result("Get Content Notifications", False, error=str(e))
        return False

def test_content_preview_discard():
    """Test DELETE /content/previews/{preview_id} - Discard preview."""
    global admin_auth_token, test_node_id
    
    if not admin_auth_token:
        print_test_result("Discard Content Preview", False, error="No admin auth token available")
        return False
    
    try:
        # First create a preview to discard
        get_response = requests.get(
            f"{API_URL}/content/nodes/{test_node_id}",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        if get_response.status_code != 200:
            print_test_result("Discard Content Preview", False, error="Could not get current content")
            return False
        
        current_content = get_response.json()
        
        preview_data = {
            "content_id": current_content["id"],
            "changes": {
                "title": f"Discard Test Title {random_string()}",
                "description": "This preview will be discarded."
            },
            "preview_duration_hours": 1
        }
        
        create_response = requests.post(
            f"{API_URL}/content/nodes/{test_node_id}/preview",
            headers={"Authorization": f"Bearer {admin_auth_token}"},
            json=preview_data
        )
        
        if create_response.status_code != 200:
            print_test_result("Discard Content Preview", False, error="Could not create preview to discard")
            return False
        
        preview_id = create_response.json().get("preview_id")
        
        # Now discard the preview
        response = requests.delete(
            f"{API_URL}/content/previews/{preview_id}",
            headers={"Authorization": f"Bearer {admin_auth_token}"}
        )
        
        success = response.status_code == 200 and "message" in response.json()
        print_test_result("Discard Content Preview", success, response)
        return success
    except Exception as e:
        print_test_result("Discard Content Preview", False, error=str(e))
        return False

def test_content_different_node_types():
    """Test content management with different node types."""
    global admin_auth_token
    
    if not admin_auth_token:
        print_test_result("Different Node Types", False, error="No admin auth token available")
        return False
    
    try:
        # Test with different node IDs
        test_nodes = ["step2", "bonus1", "step3"]
        success_count = 0
        
        for node_id in test_nodes:
            response = requests.get(
                f"{API_URL}/content/nodes/{node_id}",
                headers={"Authorization": f"Bearer {admin_auth_token}"}
            )
            
            if response.status_code == 200 and "node_id" in response.json():
                success_count += 1
        
        success = success_count == len(test_nodes)
        print_test_result("Different Node Types", success, 
                         response=None, 
                         error=None if success else f"Only {success_count}/{len(test_nodes)} nodes accessible")
        return success
    except Exception as e:
        print_test_result("Different Node Types", False, error=str(e))
        return False

def run_content_management_tests():
    """Run comprehensive Content Management System tests."""
    print("\n" + "=" * 80)
    print("CONTENT MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    print(f"Testing Content Management API at: {API_URL}")
    print(f"Admin credentials: {ADMIN_EMAIL}")
    print("-" * 80)
    
    # Track test results
    results = {}
    
    # 1. Admin Authentication Test
    print("\n🔐 ADMIN AUTHENTICATION TESTING")
    print("-" * 40)
    results["admin_auth"] = test_content_admin_auth()
    
    # 2. Node Content CRUD Operations
    print("\n📝 NODE CONTENT CRUD OPERATIONS")
    print("-" * 40)
    results["nodes_list"] = test_content_nodes_list()
    results["node_get"] = test_content_node_get()
    results["node_update"] = test_content_node_update()
    results["different_nodes"] = test_content_different_node_types()
    
    # 3. Preview System Testing
    print("\n👁️ PREVIEW SYSTEM TESTING")
    print("-" * 40)
    results["preview_create"] = test_content_preview_create()
    results["preview_get"] = test_content_preview_get()
    results["preview_publish"] = test_content_preview_publish()
    results["preview_discard"] = test_content_preview_discard()
    
    # 4. File Upload System
    print("\n📁 FILE UPLOAD SYSTEM")
    print("-" * 40)
    results["file_upload"] = test_content_file_upload()
    results["file_serve"] = test_content_file_serve()
    
    # 5. Version History
    print("\n📚 VERSION HISTORY SYSTEM")
    print("-" * 40)
    results["versions"] = test_content_versions()
    results["revert"] = test_content_revert()
    
    # 6. Real-time Notifications
    print("\n🔔 REAL-TIME NOTIFICATIONS")
    print("-" * 40)
    results["notifications"] = test_content_notifications()
    
    # Print final summary
    print("\n" + "=" * 80)
    print("CONTENT MANAGEMENT SYSTEM - FINAL TEST RESULTS")
    print("=" * 80)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    # Group results by category
    categories = {
        "Authentication": ["admin_auth"],
        "CRUD Operations": ["nodes_list", "node_get", "node_update", "different_nodes"],
        "Preview System": ["preview_create", "preview_get", "preview_publish", "preview_discard"],
        "File Management": ["file_upload", "file_serve"],
        "Version Control": ["versions", "revert"],
        "Notifications": ["notifications"]
    }
    
    for category, test_names in categories.items():
        print(f"\n{category}:")
        for test_name in test_names:
            if test_name in results:
                status = "✅ PASSED" if results[test_name] else "❌ FAILED"
                print(f"  {test_name}: {status}")
    
    print("\n" + "-" * 80)
    print(f"OVERALL RESULT: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL CONTENT MANAGEMENT TESTS PASSED! The CMS API is fully functional.")
    else:
        print(f"⚠️  {total - passed} tests failed. Please review the failed tests above.")
    
    print("=" * 80)
    
    return results

if __name__ == "__main__":
    run_content_management_tests()