# ApprobMed - AI-Powered Medical License Guide for Germany

ApprobMed is a comprehensive platform designed to guide medical graduates through the complex process of obtaining Approbation (medical license) and passing the Fachsprachprüfung (FSP) in Germany.

## 🎯 Features

### Core Features
- **AI-Powered Assistant**: Personalized guidance using Google Gemini AI
- **Document Management**: Track and manage all required documents with Bundesland-specific requirements
- **FSP Preparation**: Medical German vocabulary training and exam preparation tools
- **Progress Tracking**: Visual progress indicators and timeline estimations
- **Multi-language Support**: Available in English, German, and Romanian

### Security Features
- JWT-based authentication with secure token handling
- Password strength validation and account lockout protection
- File upload validation with virus scanning placeholder
- Rate limiting on sensitive endpoints
- Comprehensive audit logging for GDPR compliance
- Encrypted data storage for sensitive information

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB 4.4+
- Node.js 16+ (for frontend)
- Google Gemini API key
- Stripe API key (for payments)

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd approbmed
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start MongoDB (if not running):
```bash
mongod --dbpath /path/to/data
```

6. Run the backend server:
```bash
cd ..
./scripts/start_backend.sh
```

The API will be available at `http://localhost:8000`

### Frontend Setup

(Frontend implementation pending)

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update user profile

#### Documents
- `GET /api/documents/requirements/{bundesland}` - Get Bundesland-specific requirements
- `GET /api/documents/checklist` - Get personalized document checklist
- `POST /api/files/upload` - Upload document files
- `GET /api/documents/timeline` - Get estimated timeline

#### AI Assistant
- `POST /api/ai-assistant/chat` - Chat with AI assistant
- `GET /api/ai-assistant/chat-history` - Get chat history
- `POST /api/ai-assistant/quick-tips` - Get quick tips on topics
- `POST /api/ai-assistant/analyze-profile` - Get profile analysis

## 🏗️ Architecture

### Backend Stack
- **FastAPI**: Modern Python web framework
- **MongoDB**: Document database with Motor async driver
- **Pydantic**: Data validation and serialization
- **Google Gemini**: AI-powered chat assistance
- **JWT**: Secure authentication
- **Stripe**: Payment processing

### Security Measures
- Environment-based configuration
- Rate limiting on authentication endpoints
- File type and size validation
- Path traversal protection
- SQL injection prevention (NoSQL)
- CORS configuration with allowed origins
- Security headers middleware

## 🔒 Security Fixes Implemented

1. **Fixed hardcoded JWT secret** - Now requires environment variable
2. **Restricted CORS origins** - No longer accepts all origins
3. **Added file upload validation** - Type, size, and content checks
4. **Implemented proper RBAC** - Role-based access control for admins
5. **Added rate limiting** - Protection against brute force attacks
6. **Improved encryption key storage** - Environment-based keys
7. **Added input validation** - Sanitization of user inputs
8. **Implemented audit logging** - GDPR compliance tracking

## 📋 Environment Variables

Key environment variables (see `.env.example` for full list):
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `JWT_SECRET`: Secret key for JWT tokens (generate a strong random key)
- `GEMINI_API_KEY`: Google Gemini API key
- `STRIPE_API_KEY`: Stripe API key for payments
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## 🧪 Testing

Run tests with:
```bash
pytest tests/
```

## 📄 License & Disclaimers

### Medical & Legal Disclaimer
ApprobMed provides educational guidance only. Users must:
- Verify all requirements with official German authorities
- Not rely solely on this app for medical or legal decisions
- Understand that requirements may change

### Data Privacy
- GDPR compliant with data export and deletion features
- User data encrypted at rest
- Audit logs maintained for compliance
- No medical advice provided

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🐛 Bug Reporting

Please report bugs through GitHub Issues with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- System information

## 📞 Support

For support, please contact: support@approbmed.com

---

**Note**: This application is under active development. Some features may be incomplete or subject to change.
