# Environment Setup for FSP Navigator Backend

This document provides instructions for setting up secure environment variables for the FSP Navigator backend.

## 🔐 Required Environment Variables

**⚠️  SECURITY WARNING:** Never commit real credentials or cryptographic keys to version control. The `.env.example` file contains only placeholder values.

The following environment variables must be set in your `.env` file:

### Database Configuration
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name

### Authentication & Security
- `JWT_SECRET_KEY`: Secret key for JWT token signing (min 32 chars)
- `ENCRYPTION_KEY`: Key for data encryption (min 32 chars)

### Environment
- `ENVIRONMENT`: Environment name (production, development, test)

## 🚀 Quick Setup

### 1. Generate Secure Keys

Run the key generation script to create secure keys:

```bash
cd backend
python3 generate_keys.py
```

This will output:
- A secure JWT secret key
- A secure encryption key
- Save them to `.generated_keys.txt` for easy copying

### 2. Create Your .env File

Copy the example file and update with your values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and replace the placeholder values with:
- Your actual MongoDB connection string
- The generated JWT_SECRET_KEY
- The generated ENCRYPTION_KEY
- Your desired environment settings

### 3. Test Configuration

Test that your settings can be loaded:

```bash
cd backend
python3 test_settings.py
```

Test MongoDB connection (requires dependencies):

```bash
cd backend
python3 test_mongodb_connection.py
```

## 🔧 Manual Key Generation

If you prefer to generate keys manually:

### JWT Secret Key
Generate a secure JWT secret key (minimum 32 characters):
```python
import secrets
jwt_key = secrets.token_urlsafe(64)
```

### Encryption Key
Generate a secure encryption key (32 bytes base64 encoded):
```python
import secrets
import base64
random_bytes = secrets.token_bytes(32)
encryption_key = base64.urlsafe_b64encode(random_bytes).decode()
```

## 🧪 Testing

### Health Check Endpoint
Once the server is running, test the MongoDB connection:

```bash
curl http://localhost:8000/api/ping
```

Expected response when MongoDB is connected:
```json
{"message": "pong", "database": "fsp_navigator"}
```

### Server Startup
Start the server with:

```bash
cd backend
uvicorn server:app --reload
```

The server will:
- ✅ Load all environment variables with validation
- ✅ Connect to MongoDB and log success
- ❌ Fail fast with clear error messages if anything is missing

## 🔒 Security Notes

- **Never commit your `.env` file** to version control
- **Keep your keys secure** and backup safely
- **Use different keys** for different environments
- **Rotate keys regularly** in production
- **Monitor for unauthorized access** to your MongoDB database

## 🚨 Error Handling

The application will fail fast with clear error messages if:

- Required environment variables are missing
- MongoDB connection fails
- Keys are too short (less than 32 characters)
- Invalid MongoDB URL format

## 📝 Example .env File

```env
# Database Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=fsp_navigator

# Authentication
JWT_SECRET_KEY=your-generated-jwt-secret-key-here
ENCRYPTION_KEY=your-generated-encryption-key-here

# Environment
ENVIRONMENT=production

# Optional: Other settings...
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## 🔍 Troubleshooting

### "Missing required environment variables"
- Check that your `.env` file exists in the `backend/` directory
- Verify all required variables are set
- Ensure no typos in variable names

### "MongoDB connection failed"
- Verify your MongoDB URL is correct
- Check network connectivity to MongoDB
- Ensure MongoDB is running and accessible

### "JWT_SECRET_KEY must be at least 32 characters"
- Generate a new, longer key using the provided script
- Ensure the key is properly copied to your `.env` file

### "ENCRYPTION_KEY must be at least 32 characters"
- Generate a new, longer key using the provided script
- Ensure the key is properly copied to your `.env` file