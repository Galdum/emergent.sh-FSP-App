# ApprobMed Preview Guide

## 🚀 The preview server is now running!

You can access the ApprobMed application in the following ways:

### 1. Web Interface (Recommended)
Open your web browser and visit:
- **Main App**: http://localhost:8000/
- **API Documentation**: http://localhost:8000/docs

### 2. Features You Can Test

#### In the Web Interface:
1. **User Registration & Login**
   - Click "Register" tab
   - Enter email and password (min 8 characters for full version)
   - After registration, you'll be logged in automatically

2. **Dashboard**
   - View your progress overview
   - See quick stats about your application status

3. **Document Checklist**
   - Click "Documents" tab
   - View required documents for German medical license
   - See status of each document (pending/uploaded/verified)

4. **AI Assistant**
   - Click "AI Assistant" tab
   - Ask questions about the Approbation process
   - Get mock responses (full version uses Google Gemini AI)

5. **Bundesland Requirements**
   - Click "Requirements" tab
   - Select a German state (Bundesland)
   - View specific document requirements for that state

### 3. API Testing

You can also test the API directly using curl or any API client:

#### Register a new user:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","first_name":"Test","last_name":"User"}'
```

#### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Chat with AI Assistant (use token from login):
```bash
curl -X POST http://localhost:8000/api/ai-assistant/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"message":"How do I start my Approbation process?","language":"en"}'
```

### 4. Preview Limitations

This is a preview server with:
- ✅ Working authentication system
- ✅ Basic API endpoints
- ✅ Interactive web interface
- ❌ Mock AI responses (no real Gemini integration)
- ❌ In-memory storage (data lost on restart)
- ❌ No real file uploads
- ❌ No payment processing

### 5. Full Version Features

The complete ApprobMed platform includes:
- Real AI assistant powered by Google Gemini
- Persistent MongoDB database
- Secure file upload with virus scanning
- Payment processing with Stripe
- Email notifications
- GDPR-compliant data handling
- Multi-language support (EN, DE, RO)
- Gamification features
- FSP exam preparation tools

### 6. Stopping the Server

To stop the preview server:
1. Go back to your terminal
2. Press `Ctrl+C`

### 7. Running the Full Version

To run the full version with all features:
1. Install MongoDB
2. Set up environment variables in `backend/.env`
3. Install all Python dependencies
4. Run: `./scripts/start_backend.sh`

## 🎯 What This Demonstrates

This preview shows:
- The user interface design and flow
- API structure and endpoints
- Document management workflow
- AI assistant integration pattern
- Multi-language support structure
- Security features (JWT authentication)

Perfect for:
- Understanding the application flow
- Testing the user experience
- Reviewing API design
- Planning frontend development

Enjoy exploring ApprobMed! 🏥