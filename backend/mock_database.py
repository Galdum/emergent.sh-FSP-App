"""
Mock database implementation for testing without MongoDB.
This provides a simple in-memory database that mimics MongoDB operations.
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid

class MockCollection:
    def __init__(self, name: str):
        self.name = name
        self.documents: List[Dict[str, Any]] = []
        self.indexes = {}
    
    async def insert_one(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a single document."""
        if 'id' not in document:
            document['id'] = str(uuid.uuid4())
        if 'created_at' not in document:
            document['created_at'] = datetime.utcnow()
        if 'updated_at' not in document:
            document['updated_at'] = datetime.utcnow()
        
        self.documents.append(document.copy())
        return {"inserted_id": document['id']}
    
    async def find_one(self, filter_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single document matching the filter."""
        for doc in self.documents:
            if all(doc.get(k) == v for k, v in filter_dict.items()):
                return doc.copy()
        return None
    
    async def find(self, filter_dict: Optional[Dict[str, Any]] = None) -> 'MockCursor':
        """Find documents matching the filter."""
        if filter_dict is None:
            filter_dict = {}
        
        matching_docs = []
        for doc in self.documents:
            if all(doc.get(k) == v for k, v in filter_dict.items()):
                matching_docs.append(doc.copy())
        
        return MockCursor(matching_docs)
    
    async def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Update a single document."""
        for doc in self.documents:
            if all(doc.get(k) == v for k, v in filter_dict.items()):
                doc.update(update_dict)
                doc['updated_at'] = datetime.utcnow()
                return {"modified_count": 1}
        return {"modified_count": 0}
    
    async def delete_one(self, filter_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Delete a single document."""
        for i, doc in enumerate(self.documents):
            if all(doc.get(k) == v for k, v in filter_dict.items()):
                del self.documents[i]
                return {"deleted_count": 1}
        return {"deleted_count": 0}
    
    async def create_index(self, field: str, **kwargs):
        """Create an index on a field."""
        self.indexes[field] = kwargs

class MockCursor:
    def __init__(self, documents: List[Dict[str, Any]]):
        self.documents = documents
        self._skip = 0
        self._limit = None
    
    def skip(self, count: int) -> 'MockCursor':
        self._skip = count
        return self
    
    def limit(self, count: int) -> 'MockCursor':
        self._limit = count
        return self
    
    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        """Convert cursor to list."""
        start = self._skip
        end = start + (self._limit or length or len(self.documents))
        return self.documents[start:end]

class MockDatabase:
    def __init__(self):
        self.collections: Dict[str, MockCollection] = {}
    
    def __getitem__(self, collection_name: str) -> MockCollection:
        """Get a collection by name."""
        if collection_name not in self.collections:
            self.collections[collection_name] = MockCollection(collection_name)
        return self.collections[collection_name]
    
    def __getattr__(self, name: str) -> MockCollection:
        """Get a collection by attribute name."""
        return self[name]

# Global mock database instance
mock_db = MockDatabase()

# Mock Redis implementation
class MockRedis:
    def __init__(self):
        self.data = {}
    
    async def get(self, key: str) -> Optional[str]:
        return self.data.get(key)
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self.data[key] = value
        return True
    
    async def delete(self, key: str) -> int:
        if key in self.data:
            del self.data[key]
            return 1
        return 0
    
    async def exists(self, key: str) -> int:
        return 1 if key in self.data else 0

mock_redis = MockRedis()