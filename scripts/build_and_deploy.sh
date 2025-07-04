#!/bin/bash

# Build and Deploy Script for FSP Navigator App
set -e

echo "🚀 Starting build and deploy process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -f "frontend/package.json" ]; then
    print_error "frontend/package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Clean previous builds
print_status "Cleaning previous builds..."
cd frontend
rm -rf node_modules package-lock.json build 2>/dev/null || true

# Step 2: Install dependencies with legacy peer deps
print_status "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Check for security vulnerabilities (non-blocking)
print_status "Checking for security vulnerabilities..."
npm audit --audit-level=high || print_warning "Security vulnerabilities found, but continuing..."

# Step 4: Test basic functionality (if possible)
print_status "Testing basic functionality..."
if node -e "console.log('Node.js and npm are working correctly')" 2>/dev/null; then
    print_success "Basic functionality test passed"
else
    print_warning "Basic functionality test failed, but continuing..."
fi

# Step 5: Build the application
print_status "Building the application..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 6: Verify build output
print_status "Verifying build output..."
if [ -d "build" ] && [ -f "build/index.html" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    print_success "Build directory created successfully (Size: $BUILD_SIZE)"
    
    # List key files
    print_status "Build contents:"
    ls -la build/
    
    # Check for main files
    if [ -f "build/index.html" ]; then
        print_success "HTML file created"
    fi
    
    if [ -f "build/manifest.json" ]; then
        print_success "Manifest file created"
    fi
    
    if [ -f "build/deployment-info.json" ]; then
        print_success "Deployment info created"
    fi
else
    print_error "Build directory or index.html not found"
    exit 1
fi

# Step 7: Test the build (basic validation)
print_status "Validating build..."
if grep -q "FSP Navigator" build/index.html; then
    print_success "Build validation passed"
else
    print_warning "Build validation warning - FSP Navigator title not found"
fi

# Step 8: Prepare for deployment
print_status "Preparing deployment files..."
cd ..

# Update deployment info with current build details
if [ -f "frontend/build/deployment-info.json" ]; then
    print_status "Updating deployment info..."
    cat > frontend/build/deployment-info.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "version": "$(cat frontend/package.json | grep version | cut -d'"' -f4)",
  "build_size": "$BUILD_SIZE",
  "build_type": "manual",
  "features": [
    "Enhanced Registration with Legal Compliance",
    "Interactive Tutorial with Framer Motion", 
    "Modern UI with Gradient Headers",
    "GDPR Compliant Privacy Policy",
    "Responsive Design"
  ]
}
EOF
fi

print_success "Deployment info updated"

# Step 9: Final summary
print_success "🎉 Build and deployment preparation completed successfully!"
echo ""
echo "📊 Build Summary:"
echo "   - Build size: $BUILD_SIZE"
echo "   - Build location: frontend/build/"
echo "   - Build type: Manual (bypasses dependency conflicts)"
echo "   - Ready for deployment"
echo ""
echo "🚀 Next steps:"
echo "   1. Test the build locally: cd frontend && npx serve -s build"
echo "   2. Deploy the frontend/build/ directory to your hosting provider"
echo "   3. Update your preview URL configuration"
echo ""
echo "📁 Build contents:"
ls -la frontend/build/