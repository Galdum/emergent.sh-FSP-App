"""
Unit tests for Reddit-style Forum functionality
Tests premium access, thread creation, commenting, and voting
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from backend.server import app
from backend.models import UserInDB, Forum, Thread, Comment
from backend.auth import create_access_token
from motor.motor_asyncio import AsyncIOMotorClient
from backend.settings import settings
import uuid
from datetime import datetime

# Test database client
client = AsyncIOMotorClient(settings.mongo_url)
test_db = client[f"{settings.db_name}_test"]

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest.fixture
async def premium_user():
    """Create a premium user for testing"""
    user = UserInDB(
        id=str(uuid.uuid4()),
        email="premium@test.com",
        password_hash="hashed_password",
        subscription_tier="PREMIUM",
        is_active=True
    )
    await test_db.users.insert_one(user.dict())
    return user

@pytest.fixture
async def free_user():
    """Create a free user for testing"""
    user = UserInDB(
        id=str(uuid.uuid4()),
        email="free@test.com",
        password_hash="hashed_password",
        subscription_tier="FREE",
        is_active=True
    )
    await test_db.users.insert_one(user.dict())
    return user

@pytest.fixture
async def test_forum():
    """Create a test forum"""
    forum = Forum(
        slug="test-forum",
        title="Test Forum",
        description="A forum for testing",
        premium_only=True,
        created_by="system"
    )
    await test_db.forums.insert_one(forum.dict())
    return forum

@pytest.fixture
def premium_auth_header(premium_user):
    """Create authentication header for premium user"""
    token = create_access_token(data={"sub": premium_user.id})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def free_auth_header(free_user):
    """Create authentication header for free user"""
    token = create_access_token(data={"sub": free_user.id})
    return {"Authorization": f"Bearer {token}"}

class TestForumAccess:
    """Test forum access control"""
    
    def test_premium_user_can_access_forums(self, test_client, premium_auth_header):
        """Premium user should be able to access forums"""
        response = test_client.get("/api/forums/", headers=premium_auth_header)
        assert response.status_code == 200
    
    def test_free_user_cannot_access_forums(self, test_client, free_auth_header):
        """Free user should not be able to access forums"""
        response = test_client.get("/api/forums/", headers=free_auth_header)
        assert response.status_code == 403
        assert "Premium subscription required" in response.json()["detail"]
    
    def test_unauthenticated_user_cannot_access_forums(self, test_client):
        """Unauthenticated user should not be able to access forums"""
        response = test_client.get("/api/forums/")
        assert response.status_code == 401

class TestThreadCreation:
    """Test thread creation functionality"""
    
    @pytest.mark.asyncio
    async def test_premium_user_can_create_thread(self, test_client, premium_auth_header, test_forum):
        """Premium user should be able to create threads"""
        thread_data = {
            "title": "Test Thread",
            "body": "This is a test thread",
            "attachments": []
        }
        
        response = test_client.post(
            f"/api/forums/{test_forum.slug}/threads",
            json=thread_data,
            headers=premium_auth_header
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Thread"
        assert data["body"] == "This is a test thread"
        assert data["up_votes"] == 0
        assert data["down_votes"] == 0
    
    @pytest.mark.asyncio
    async def test_free_user_cannot_create_thread(self, test_client, free_auth_header, test_forum):
        """Free user should not be able to create threads"""
        thread_data = {
            "title": "Test Thread",
            "body": "This is a test thread",
            "attachments": []
        }
        
        response = test_client.post(
            f"/api/forums/{test_forum.slug}/threads",
            json=thread_data,
            headers=free_auth_header
        )
        
        assert response.status_code == 403

class TestVotingSystem:
    """Test voting functionality"""
    
    @pytest.fixture
    async def test_thread(self, premium_user, test_forum):
        """Create a test thread"""
        thread = Thread(
            forum_id=test_forum.id,
            author_id=premium_user.id,
            title="Test Thread",
            body="Test content",
            up_votes=5,
            down_votes=2
        )
        await test_db.threads.insert_one(thread.dict())
        return thread
    
    @pytest.mark.asyncio
    async def test_premium_user_can_vote_on_thread(self, test_client, premium_auth_header, test_thread):
        """Premium user should be able to vote on threads"""
        vote_data = {"value": 1}
        
        response = test_client.post(
            f"/api/forums/thread/{test_thread.id}/vote",
            json=vote_data,
            headers=premium_auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Vote recorded successfully"
    
    @pytest.mark.asyncio
    async def test_vote_value_validation(self, test_client, premium_auth_header, test_thread):
        """Vote values should be validated"""
        # Test invalid vote value
        vote_data = {"value": 2}  # Invalid, should be -1, 0, or 1
        
        response = test_client.post(
            f"/api/forums/thread/{test_thread.id}/vote",
            json=vote_data,
            headers=premium_auth_header
        )
        
        assert response.status_code == 422  # Validation error

class TestFileUpload:
    """Test file upload functionality"""
    
    def test_premium_user_can_upload_file(self, test_client, premium_auth_header):
        """Premium user should be able to upload files"""
        # Create a test image file
        test_file_content = b"fake image content"
        files = {
            "file": ("test.jpg", test_file_content, "image/jpeg")
        }
        
        response = test_client.post(
            "/api/forums/upload",
            files=files,
            headers=premium_auth_header
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "image"
        assert data["file_name"] == "test.jpg"
        assert data["mime_type"] == "image/jpeg"
        assert "url" in data
    
    def test_file_size_limit(self, test_client, premium_auth_header):
        """File upload should respect size limits"""
        # Create a large file (> 5MB for images)
        large_file_content = b"x" * (6 * 1024 * 1024)  # 6MB
        files = {
            "file": ("large.jpg", large_file_content, "image/jpeg")
        }
        
        response = test_client.post(
            "/api/forums/upload",
            files=files,
            headers=premium_auth_header
        )
        
        assert response.status_code == 413  # File too large

class TestCommentSystem:
    """Test comment functionality"""
    
    @pytest.fixture
    async def test_thread_with_comments(self, premium_user, test_forum):
        """Create a test thread with comments"""
        thread = Thread(
            forum_id=test_forum.id,
            author_id=premium_user.id,
            title="Test Thread",
            body="Test content"
        )
        await test_db.threads.insert_one(thread.dict())
        
        # Add some comments
        comment1 = Comment(
            thread_id=thread.id,
            author_id=premium_user.id,
            body="First comment",
            up_votes=3,
            down_votes=1
        )
        await test_db.comments.insert_one(comment1.dict())
        
        comment2 = Comment(
            thread_id=thread.id,
            author_id=premium_user.id,
            body="Reply to first comment",
            parent_id=comment1.id,
            up_votes=2,
            down_votes=0
        )
        await test_db.comments.insert_one(comment2.dict())
        
        return thread, [comment1, comment2]
    
    @pytest.mark.asyncio
    async def test_get_comments_nested_structure(self, test_client, premium_auth_header, test_thread_with_comments):
        """Comments should be returned in nested structure"""
        thread, comments = test_thread_with_comments
        
        response = test_client.get(
            f"/api/forums/thread/{thread.id}/comments",
            headers=premium_auth_header
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have one root comment with one reply
        assert len(data) == 1
        root_comment = data[0]
        assert root_comment["body"] == "First comment"
        assert len(root_comment["replies"]) == 1
        assert root_comment["replies"][0]["body"] == "Reply to first comment"
    
    @pytest.mark.asyncio
    async def test_comment_sorting(self, test_client, premium_auth_header, test_thread_with_comments):
        """Comments should be sortable by different criteria"""
        thread, comments = test_thread_with_comments
        
        # Test sorting by best (vote score)
        response = test_client.get(
            f"/api/forums/thread/{thread.id}/comments?sort=best",
            headers=premium_auth_header
        )
        assert response.status_code == 200
        
        # Test sorting by newest
        response = test_client.get(
            f"/api/forums/thread/{thread.id}/comments?sort=newest",
            headers=premium_auth_header
        )
        assert response.status_code == 200
        
        # Test sorting by oldest
        response = test_client.get(
            f"/api/forums/thread/{thread.id}/comments?sort=oldest",
            headers=premium_auth_header
        )
        assert response.status_code == 200

# Cleanup after tests
@pytest.fixture(autouse=True)
async def cleanup():
    """Clean up test data after each test"""
    yield
    # Clean up test collections
    await test_db.users.delete_many({})
    await test_db.forums.delete_many({})
    await test_db.threads.delete_many({})
    await test_db.comments.delete_many({})
    await test_db.votes.delete_many({})

if __name__ == "__main__":
    pytest.main([__file__, "-v"])