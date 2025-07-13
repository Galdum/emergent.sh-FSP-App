#!/usr/bin/env python3
"""
Complete automated test for the download endpoint.
This script starts the mock server, tests the full upload/download flow, and verifies everything works.
"""

import asyncio
import subprocess
import time
import requests
import tempfile
import os
import sys
from pathlib import Path
import json

# Test configuration
API_BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"
TEST_FILENAME = "test_document.txt"
TEST_CONTENT = "This is a test document for the download endpoint. It contains some sample text to verify that file upload and download functionality works correctly."

class DownloadEndpointTester:
    def __init__(self):
        self.server_process = None
        self.auth_token = None
        self.uploaded_file_id = None
        
    def start_server(self):
        """Start the mock server in the background."""
        print("🚀 Starting mock server...")
        self.server_process = subprocess.Popen(
            [sys.executable, "mock_server.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for server to start
        print("⏳ Waiting for server to start...")
        for i in range(30):  # Wait up to 30 seconds
            try:
                response = requests.get(f"{API_BASE_URL}/api/health", timeout=1)
                if response.status_code == 200:
                    print("✅ Server is running!")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(1)
            if i % 5 == 0:
                print(f"   Still waiting... ({i+1}/30)")
        
        print("❌ Server failed to start")
        return False
    
    def stop_server(self):
        """Stop the mock server."""
        if self.server_process:
            print("🛑 Stopping server...")
            self.server_process.terminate()
            self.server_process.wait()
            print("✅ Server stopped")
    
    def register_user(self):
        """Register a new user."""
        print("👤 Registering test user...")
        response = requests.post(
            f"{API_BASE_URL}/api/auth/register",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "first_name": "Test",
                "last_name": "User"
            }
        )
        
        if response.status_code == 200:
            self.auth_token = response.json()["access_token"]
            print("✅ User registered successfully")
            return True
        else:
            print(f"❌ User registration failed: {response.status_code} - {response.text}")
            return False
    
    def login_user(self):
        """Login with the test user."""
        print("🔐 Logging in...")
        response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        if response.status_code == 200:
            self.auth_token = response.json()["access_token"]
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def upload_file(self):
        """Upload a test file."""
        print("📤 Uploading test file...")
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(TEST_CONTENT)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': (TEST_FILENAME, f, 'text/plain')}
                headers = {'Authorization': f'Bearer {self.auth_token}'}
                
                response = requests.post(
                    f"{API_BASE_URL}/api/files/upload",
                    files=files,
                    headers=headers
                )
            
            if response.status_code == 200:
                file_data = response.json()
                self.uploaded_file_id = file_data["id"]
                print(f"✅ File uploaded successfully (ID: {self.uploaded_file_id})")
                return True
            else:
                print(f"❌ File upload failed: {response.status_code} - {response.text}")
                return False
                
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
    
    def list_files(self):
        """List user's files."""
        print("📋 Listing files...")
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        response = requests.get(f"{API_BASE_URL}/api/files/", headers=headers)
        
        if response.status_code == 200:
            files = response.json()
            print(f"✅ Found {len(files)} files")
            for file in files:
                print(f"   - {file['title']} (ID: {file['id']}, Type: {file['type']})")
            return files
        else:
            print(f"❌ Failed to list files: {response.status_code} - {response.text}")
            return []
    
    def download_file(self):
        """Download the uploaded file."""
        if not self.uploaded_file_id:
            print("❌ No file ID available for download")
            return False
        
        print(f"📥 Downloading file (ID: {self.uploaded_file_id})...")
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        response = requests.get(
            f"{API_BASE_URL}/api/files/download/{self.uploaded_file_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            # Save downloaded content
            downloaded_content = response.content.decode('utf-8')
            print(f"✅ File downloaded successfully ({len(downloaded_content)} characters)")
            
            # Verify content matches
            if downloaded_content == TEST_CONTENT:
                print("✅ Downloaded content matches original content")
                return True
            else:
                print("❌ Downloaded content does not match original content")
                print(f"   Expected: {len(TEST_CONTENT)} characters")
                print(f"   Got: {len(downloaded_content)} characters")
                return False
        else:
            print(f"❌ File download failed: {response.status_code} - {response.text}")
            return False
    
    def test_unauthorized_access(self):
        """Test that unauthorized access is properly rejected."""
        print("🔒 Testing unauthorized access...")
        
        # Try to download without token
        response = requests.get(f"{API_BASE_URL}/api/files/download/{self.uploaded_file_id}")
        if response.status_code == 401:
            print("✅ Unauthorized access properly rejected (no token)")
        else:
            print(f"❌ Unauthorized access not properly rejected: {response.status_code}")
            return False
        
        # Try to download with invalid token
        headers = {'Authorization': 'Bearer invalid_token'}
        response = requests.get(
            f"{API_BASE_URL}/api/files/download/{self.uploaded_file_id}",
            headers=headers
        )
        if response.status_code == 401:
            print("✅ Invalid token properly rejected")
        else:
            print(f"❌ Invalid token not properly rejected: {response.status_code}")
            return False
        
        return True
    
    def test_nonexistent_file(self):
        """Test that downloading a nonexistent file returns 404."""
        print("🔍 Testing download of nonexistent file...")
        fake_file_id = "00000000-0000-0000-0000-000000000000"
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        response = requests.get(
            f"{API_BASE_URL}/api/files/download/{fake_file_id}",
            headers=headers
        )
        
        if response.status_code == 404:
            print("✅ Nonexistent file properly returns 404")
            return True
        else:
            print(f"❌ Nonexistent file should return 404, got: {response.status_code}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence."""
        print("🧪 Starting comprehensive download endpoint test")
        print("=" * 60)
        
        try:
            # Start server
            if not self.start_server():
                return False
            
            # Register user
            if not self.register_user():
                return False
            
            # List files (should be empty)
            self.list_files()
            
            # Upload file
            if not self.upload_file():
                return False
            
            # List files (should have one file)
            self.list_files()
            
            # Download file
            if not self.download_file():
                return False
            
            # Test security
            if not self.test_unauthorized_access():
                return False
            
            # Test nonexistent file
            if not self.test_nonexistent_file():
                return False
            
            print("\n" + "=" * 60)
            print("🎉 ALL TESTS PASSED! The download endpoint is working correctly.")
            print("=" * 60)
            return True
            
        except Exception as e:
            print(f"\n❌ Test failed with exception: {e}")
            return False
        finally:
            self.stop_server()

def main():
    """Main test runner."""
    tester = DownloadEndpointTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Download endpoint implementation is complete and working!")
        print("📝 Summary:")
        print("   - File upload works correctly")
        print("   - File download works correctly")
        print("   - Authentication is properly enforced")
        print("   - Security checks are in place")
        print("   - Error handling works correctly")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1)

if __name__ == "__main__":
    main()