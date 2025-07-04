#!/bin/bash

# 🔍 FSP Navigator - emergent.sh Compatibility Verification Script
# This script verifies that all changes have been properly implemented for emergent.sh deployment

echo "🚀 FSP Navigator - emergent.sh Compatibility Check"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}: $1"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: $1"
        ((FAILED++))
    fi
}

# Helper function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ PASSED${NC}: File $1 exists"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}: File $1 missing"
        ((FAILED++))
        return 1
    fi
}

# Helper function to check directory exists
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ PASSED${NC}: Directory $1 exists"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}: Directory $1 missing"
        ((FAILED++))
        return 1
    fi
}

echo -e "\n${BLUE}📁 Project Structure Verification${NC}"
echo "================================="

# Check main directories
check_directory "frontend"
check_directory "backend"
check_directory ".emergent"

# Check configuration files
check_file ".emergent/emergent.yml"
check_file "frontend/package.json"
check_file "backend/requirements.txt"
check_file "Dockerfile"
check_file "docker-compose.yml"
check_file ".env.example"
check_file "DEPLOYMENT_GUIDE.md"

echo -e "\n${BLUE}🔧 Configuration Validation${NC}"
echo "============================"

# Check emergent.yml format
if [ -f ".emergent/emergent.yml" ]; then
    if grep -q "env_image_name:" ".emergent/emergent.yml"; then
        echo -e "${GREEN}✅ PASSED${NC}: emergent.yml is in YAML format"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: emergent.yml format issue"
        ((FAILED++))
    fi
    
    if grep -q "framework: \"fullstack\"" ".emergent/emergent.yml"; then
        echo -e "${GREEN}✅ PASSED${NC}: Fullstack framework configured"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Framework configuration missing"
        ((FAILED++))
    fi
fi

# Check React version in package.json
if [ -f "frontend/package.json" ]; then
    if grep -q "\"react\": \"\\^18" "frontend/package.json"; then
        echo -e "${GREEN}✅ PASSED${NC}: React 18 configured"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: React version not updated to 18"
        ((FAILED++))
    fi
    
    if grep -q "\"node\": \">=18.0.0\"" "frontend/package.json"; then
        echo -e "${GREEN}✅ PASSED${NC}: Node.js 18+ requirement specified"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Node.js version requirement missing"
        ((FAILED++))
    fi
fi

# Check FastAPI version in requirements.txt
if [ -f "backend/requirements.txt" ]; then
    if grep -q "fastapi==0.115.0" "backend/requirements.txt"; then
        echo -e "${GREEN}✅ PASSED${NC}: FastAPI updated to 0.115.0"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: FastAPI version not updated"
        ((FAILED++))
    fi
    
    if grep -q "uvicorn\[standard\]==0.32.0" "backend/requirements.txt"; then
        echo -e "${GREEN}✅ PASSED${NC}: Uvicorn updated to 0.32.0"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Uvicorn version not updated"
        ((FAILED++))
    fi
fi

echo -e "\n${BLUE}🐳 Docker Configuration${NC}"
echo "======================="

# Check Dockerfile
if [ -f "Dockerfile" ]; then
    if grep -q "FROM node:18-alpine AS frontend-build" "Dockerfile"; then
        echo -e "${GREEN}✅ PASSED${NC}: Multi-stage Docker build configured"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Docker multi-stage build missing"
        ((FAILED++))
    fi
    
    if grep -q "ENV PORT=8000" "Dockerfile"; then
        echo -e "${GREEN}✅ PASSED${NC}: Port configuration correct"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Port configuration missing"
        ((FAILED++))
    fi
fi

# Check docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    if grep -q "version: '3.8'" "docker-compose.yml"; then
        echo -e "${GREEN}✅ PASSED${NC}: Docker Compose version specified"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Docker Compose version issue"
        ((FAILED++))
    fi
fi

echo -e "\n${BLUE}📊 Health Checks & Monitoring${NC}"
echo "=============================="

# Check for health check endpoint in server.py
if [ -f "backend/server.py" ]; then
    if grep -q "/health" "backend/server.py"; then
        echo -e "${GREEN}✅ PASSED${NC}: Health check endpoint exists"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Health check endpoint missing"
        ((FAILED++))
    fi
    
    if grep -q "sentry_sdk" "backend/server.py"; then
        echo -e "${GREEN}✅ PASSED${NC}: Sentry monitoring configured"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}: Sentry monitoring not configured (optional)"
    fi
fi

echo -e "\n${BLUE}🔒 Security Configuration${NC}"
echo "========================="

# Check CORS configuration
if [ -f "backend/server.py" ]; then
    if grep -q "CORSMiddleware" "backend/server.py"; then
        echo -e "${GREEN}✅ PASSED${NC}: CORS middleware configured"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: CORS configuration missing"
        ((FAILED++))
    fi
    
    if grep -q "SecurityHeadersMiddleware" "backend/server.py"; then
        echo -e "${GREEN}✅ PASSED${NC}: Security headers configured"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Security headers missing"
        ((FAILED++))
    fi
fi

# Check .env.example
if [ -f ".env.example" ]; then
    if grep -q "MONGO_URL=" ".env.example"; then
        echo -e "${GREEN}✅ PASSED${NC}: Environment variables documented"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Environment variables not documented"
        ((FAILED++))
    fi
fi

echo -e "\n${BLUE}📋 Build Scripts Verification${NC}"
echo "=============================="

# Check frontend build script
if [ -f "frontend/package.json" ]; then
    if grep -q "\"build\": \"GENERATE_SOURCEMAP=false react-scripts build\"" "frontend/package.json"; then
        echo -e "${GREEN}✅ PASSED${NC}: Production build script optimized"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Build script not optimized"
        ((FAILED++))
    fi
fi

echo -e "\n${BLUE}🌐 Network & Environment${NC}"
echo "======================="

# Check for environment-specific configurations
if [ -f ".env.example" ]; then
    if grep -q "NODE_ENV=production" ".env.example"; then
        echo -e "${GREEN}✅ PASSED${NC}: Production environment configured"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Production environment not configured"
        ((FAILED++))
    fi
    
    if grep -q "REACT_APP_BACKEND_URL=" ".env.example"; then
        echo -e "${GREEN}✅ PASSED${NC}: Backend URL configuration present"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Backend URL configuration missing"
        ((FAILED++))
    fi
fi

echo -e "\n${BLUE}📚 Documentation${NC}"
echo "==============="

# Check deployment guide
if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    if grep -q "emergent.sh" "DEPLOYMENT_GUIDE.md"; then
        echo -e "${GREEN}✅ PASSED${NC}: emergent.sh deployment guide available"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: Deployment guide incomplete"
        ((FAILED++))
    fi
fi

# Check README updates
if [ -f "README.md" ]; then
    if grep -q "Ready to launch" "README.md"; then
        echo -e "${GREEN}✅ PASSED${NC}: README indicates production readiness"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  INFO${NC}: Consider updating README with deployment status"
    fi
fi

echo -e "\n${BLUE}🧪 Quick Compatibility Tests${NC}"
echo "============================="

# Test if we can parse the emergent.yml file (basic syntax check)
if command -v python3 &> /dev/null; then
    python3 -c "
import yaml
try:
    with open('.emergent/emergent.yml', 'r') as f:
        yaml.safe_load(f)
    print('✅ emergent.yml syntax valid')
except Exception as e:
    print(f'❌ emergent.yml syntax error: {e}')
    exit(1)
" && ((PASSED++)) || ((FAILED++))
fi

# Test if package.json is valid JSON
if command -v node &> /dev/null; then
    node -e "
try {
    require('./frontend/package.json');
    console.log('✅ package.json syntax valid');
} catch(e) {
    console.log('❌ package.json syntax error:', e.message);
    process.exit(1);
}
" && ((PASSED++)) || ((FAILED++))
fi

echo -e "\n${BLUE}📊 Final Report${NC}"
echo "==============="

echo -e "Total Checks: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    echo -e "\n${RED}⚠️  Some issues found. Please review and fix before deploying.${NC}"
    exit 1
else
    echo -e "${RED}Failed: 0${NC}"
    echo -e "\n${GREEN}🎉 All checks passed! Your application is ready for emergent.sh deployment.${NC}"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo "1. Set up your environment variables based on .env.example"
    echo "2. Push your changes to the main branch"
    echo "3. Connect your repository to emergent.sh"
    echo "4. Configure environment variables in emergent.sh dashboard"
    echo "5. Deploy and enjoy! 🚀"
    
    echo -e "\n${BLUE}Quick Deploy Commands:${NC}"
    echo "git add ."
    echo "git commit -m \"feat: emergent.sh compatibility updates\""
    echo "git push origin main"
fi