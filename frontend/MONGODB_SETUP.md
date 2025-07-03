# MongoDB Setup Guide

## ⚠️ Important Security Notice

**This setup demonstrates MongoDB usage in React for educational purposes only.** In production applications, you should:

1. **Use backend APIs** - Database connections should be handled by your backend server
2. **Never expose credentials** - Database connection strings should never be in frontend code
3. **Use environment variables** - Store sensitive data securely on the server side

## Installation

MongoDB has been successfully installed in your React frontend:

```bash
npm install mongodb --legacy-peer-deps
```

## Current Setup

### Files Created:
- `src/utils/mongodb.js` - MongoDB connection service
- `src/components/MongoDBExample.js` - Example React component
- `.env` - Environment variables (contains your connection string)
- `.env.example` - Template for environment variables

### Environment Configuration:
Your MongoDB connection string is stored in `.env`:
```
REACT_APP_MONGODB_URI=mongodb+srv://galburdumitru1:TKarLYGvdQprfLic@fspnavigator.u6elads.mongodb.net/?retryWrites=true&w=majority&appName=fspnavigator
```

## Usage Example

```javascript
import mongoService from './utils/mongodb';

// Connect to MongoDB
await mongoService.connect();

// Insert a document
const result = await mongoService.insertDocument('users', {
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date()
});

// Find documents
const users = await mongoService.findDocuments('users', {
  name: 'John Doe'
});

// Update a document
await mongoService.updateDocument('users', 
  { name: 'John Doe' }, 
  { email: 'newemail@example.com' }
);

// Delete a document
await mongoService.deleteDocument('users', { name: 'John Doe' });

// Disconnect
await mongoService.disconnect();
```

## Better Architecture (Recommended for Production)

Instead of connecting directly from React, consider this architecture:

### 1. Backend API Service (Node.js/Express)

```javascript
// backend/routes/api.js
const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const client = new MongoClient(process.env.MONGODB_URI);

// GET /api/users
router.get('/users', async (req, res) => {
  try {
    const db = client.db('fspnavigator');
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users
router.post('/users', async (req, res) => {
  try {
    const db = client.db('fspnavigator');
    const result = await db.collection('users').insertOne(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 2. Frontend API Calls (React)

```javascript
// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const userAPI = {
  getUsers: () => axios.get(`${API_BASE_URL}/api/users`),
  createUser: (user) => axios.post(`${API_BASE_URL}/api/users`, user),
  updateUser: (id, user) => axios.put(`${API_BASE_URL}/api/users/${id}`, user),
  deleteUser: (id) => axios.delete(`${API_BASE_URL}/api/users/${id}`)
};
```

### 3. React Component Using API

```javascript
// frontend/src/components/Users.js
import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  const addUser = async (userData) => {
    try {
      await userAPI.createUser(userData);
      // Refresh the user list
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  return (
    <div>
      {/* Your UI components */}
    </div>
  );
};

export default Users;
```

## Benefits of Backend API Approach

1. **Security**: Database credentials stay on the server
2. **Performance**: Better connection pooling and caching
3. **Scalability**: Easier to scale and optimize
4. **Flexibility**: Can add authentication, validation, and business logic
5. **CORS Handling**: Avoid cross-origin issues
6. **Error Handling**: Centralized error handling and logging

## Python Backend Integration

Since you have a Python backend, you could also use PyMongo:

```python
# backend/database.py
from pymongo import MongoClient
import os

client = MongoClient(os.getenv('MONGODB_URI'))
db = client.fspnavigator

def get_users():
    return list(db.users.find({}))

def create_user(user_data):
    result = db.users.insert_one(user_data)
    return str(result.inserted_id)
```

```python
# backend/routes.py
from flask import Flask, jsonify, request
from database import get_users, create_user

app = Flask(__name__)

@app.route('/api/users', methods=['GET'])
def api_get_users():
    users = get_users()
    return jsonify(users)

@app.route('/api/users', methods=['POST'])
def api_create_user():
    user_data = request.json
    user_id = create_user(user_data)
    return jsonify({'id': user_id})
```

## Testing the Current Setup

1. Start your React development server:
   ```bash
   npm start
   ```

2. Import the `MongoDBExample` component in your app:
   ```javascript
   import MongoDBExample from './components/MongoDBExample';
   
   function App() {
     return (
       <div className="App">
         <MongoDBExample />
       </div>
     );
   }
   ```

## Security Checklist

- [x] `.env` files added to `.gitignore`
- [x] Connection string stored in environment variables
- [ ] Consider moving database operations to backend
- [ ] Add input validation and sanitization
- [ ] Implement proper error handling
- [ ] Add authentication and authorization
- [ ] Use HTTPS in production

## MongoDB Documentation

- [MongoDB Node.js Driver Documentation](https://www.mongodb.com/docs/drivers/node/current/)
- [MongoDB University Free Courses](https://university.mongodb.com/)
- [MongoDB Best Practices](https://www.mongodb.com/developer/products/mongodb/performance-best-practices-mongodb-data-modeling-and-memory-sizing/)

## Troubleshooting

### Common Issues:

1. **Connection Timeout**: Check your MongoDB Atlas network access settings
2. **Authentication Failed**: Verify your username and password in the connection string
3. **CORS Errors**: This is why backend APIs are recommended for production
4. **Environment Variables Not Loading**: Restart your development server after changing `.env`

### Getting Help:

- Check the browser console for detailed error messages
- Verify your MongoDB Atlas cluster is running
- Test the connection string using MongoDB Compass or CLI tools