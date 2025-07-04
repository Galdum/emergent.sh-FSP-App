# 🚀 Deployment Guide for emergent.sh

This guide provides step-by-step instructions for deploying FSP Navigator on emergent.sh platform.

## ✅ Pre-deployment Checklist

### 1. **Environment Variables Setup**
Copy `.env.example` to `.env` and configure:

```bash
# Required variables
MONGO_URL=mongodb://your-mongodb-connection-string
DB_NAME=fsp_navigator  
JWT_SECRET_KEY=your-secure-jwt-secret
ALLOWED_ORIGINS=https://your-domain.com
REACT_APP_BACKEND_URL=https://your-backend-url.com

# Optional but recommended
SENTRY_DSN=your-sentry-dsn
GEMINI_API_KEY=your-gemini-api-key
```

### 2. **Database Setup**
- Ensure MongoDB Atlas or compatible MongoDB service is configured
- Database will auto-initialize with required indexes on first run

### 3. **Dependencies Check**
All dependencies have been updated to latest compatible versions:
- React 18.3.1 ✅
- FastAPI 0.115.0 ✅
- Node.js 18+ ✅
- Python 3.11 ✅

## 🛠 emergent.sh Deployment

### 1. **Push to Repository**
```bash
git add .
git commit -m "feat: emergent.sh compatibility updates"
git push origin main
```

### 2. **emergent.sh Configuration**
The project includes a complete `.emergent/emergent.yml` configuration:

```yaml
env_image_name: "fastapi_react_mongo_base_image_cloud_arm:v3.1.1"
framework: "fullstack"
frontend:
  type: "react"
  build_command: "npm run build"
  output_directory: "build"
  node_version: "18"
backend:
  type: "fastapi"
  main_file: "server.py"
  python_version: "3.11"
  directory: "backend"
```

### 3. **Deployment Process**
1. Connect your GitHub repository to emergent.sh
2. Select the main branch
3. emergent.sh will automatically detect the configuration
4. Set environment variables in emergent.sh dashboard
5. Deploy! 🚀

## 🔧 Configuration Files

### Frontend (React 18)
- **package.json**: Updated with React 18 and modern dependencies
- **Build optimization**: Source maps disabled for production
- **Node.js version**: 18+ specified in engines

### Backend (FastAPI)
- **requirements.txt**: All dependencies updated to latest versions
- **Python version**: 3.11 specified
- **Health checks**: `/api/health` endpoint available
- **CORS**: Properly configured for production

### Infrastructure
- **Dockerfile**: Multi-stage build for optimized deployment
- **docker-compose.yml**: Local development environment
- **Health checks**: Automated monitoring endpoints

## 🌍 Environment-Specific Settings

### Production (emergent.sh)
```env
NODE_ENV=production
ENVIRONMENT=production
PORT=8000
ALLOWED_ORIGINS=https://your-domain.com
```

### Development (Local)
```env
NODE_ENV=development
ENVIRONMENT=development
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
```

## 🔄 CI/CD Integration

The project includes GitHub Actions workflow for:
- Automated testing
- Build verification
- Deployment preparation

## 📊 Monitoring & Health Checks

### Available Endpoints
- `/api/health` - Backend health status
- `/api/` - API root with version info
- `/__health` - Frontend health (served by React)

### Error Tracking
- Sentry integration configured
- Comprehensive logging setup
- Performance monitoring

## 🧪 Testing Deployment

### Local Testing with Docker
```bash
# Build and run the full stack
docker-compose up -d

# Test endpoints
curl http://localhost:8000/api/health
curl http://localhost:3000
```

### Production Testing
1. Verify all environment variables are set
2. Check database connectivity
3. Test API endpoints
4. Verify frontend build and routing

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
- Ensure Node.js 18+ is used
- Check package.json for any missing dependencies
- Verify environment variables are set

#### Database Connection
- Confirm MongoDB connection string
- Check network access and authentication
- Verify database name matches configuration

#### CORS Issues
- Update ALLOWED_ORIGINS environment variable
- Include all frontend domains
- Check protocol (http vs https)

### Emergency Rollback
emergent.sh provides instant rollback capabilities:
1. Access deployment dashboard
2. Select previous working version
3. Rollback with zero downtime

## 📞 Support

### Documentation
- **Frontend**: React 18 documentation
- **Backend**: FastAPI documentation  
- **Platform**: emergent.sh documentation

### Quick Commands
```bash
# Install dependencies
cd frontend && npm install
cd backend && pip install -r requirements.txt

# Build for production
cd frontend && npm run build

# Start development
./start_approbmed.sh

# Docker deployment
docker-compose up -d
```

## ✨ Features Ready for Production

✅ **Fully Responsive** - Mobile-first design  
✅ **AI Integration** - Gemini AI tutor ready  
✅ **Payment Systems** - PayPal & Stripe integrated  
✅ **Authentication** - JWT + Google OAuth  
✅ **Security** - CORS, rate limiting, headers  
✅ **Monitoring** - Health checks, Sentry  
✅ **Documentation** - Comprehensive API docs  

**🎉 Your FSP Navigator application is now ready for production deployment on emergent.sh!**