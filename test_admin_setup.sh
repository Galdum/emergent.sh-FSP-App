#!/bin/bash

# Admin Setup Test Script for FSP Navigator
# This script tests the admin initialization endpoint

echo "🔑 Testing Admin Setup for FSP Navigator"
echo "Admin Email: galburdumitru1@gmail.com"
echo "Admin Password: Anestezie130697"
echo "=" * 50

# Function to test admin initialization
test_admin_init() {
    local url=$1
    local env_name=$2
    
    echo "🧪 Testing admin initialization for $env_name..."
    echo "URL: $url"
    
    response=$(curl -s -X POST "$url/api/admin/initialize-admin" \
        -H "Content-Type: application/json" \
        -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    echo "HTTP Status: $http_status"
    echo "Response: $response_body"
    
    if [ "$http_status" = "200" ]; then
        echo "✅ Admin initialization successful for $env_name!"
        return 0
    else
        echo "❌ Admin initialization failed for $env_name"
        return 1
    fi
}

# Function to test admin login
test_admin_login() {
    local url=$1
    local env_name=$2
    
    echo "🔐 Testing admin login for $env_name..."
    
    login_response=$(curl -s -X POST "$url/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "galburdumitru1@gmail.com", "password": "Anestezie130697"}' \
        -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    http_status=$(echo "$login_response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$login_response" | sed '/HTTP_STATUS/d')
    
    echo "HTTP Status: $http_status"
    
    if [ "$http_status" = "200" ]; then
        echo "✅ Admin login successful for $env_name!"
        
        # Extract token (if the response contains it)
        if echo "$response_body" | grep -q "access_token"; then
            echo "🎫 Token received - admin access confirmed"
        fi
        return 0
    else
        echo "❌ Admin login failed for $env_name"
        echo "Response: $response_body"
        return 1
    fi
}

# Main menu
echo "Choose your environment:"
echo "1. Local Development (http://localhost:8000)"
echo "2. emergent.sh Production (enter your URL)"
echo "3. Custom URL"
echo "4. Test both Local and Production"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "📍 Testing Local Development..."
        test_admin_init "http://localhost:8000" "Local"
        echo ""
        test_admin_login "http://localhost:8000" "Local"
        ;;
    2)
        read -p "Enter your emergent.sh URL (e.g., https://your-app.emergent.sh): " prod_url
        echo "📍 Testing Production..."
        test_admin_init "$prod_url" "Production"
        echo ""
        test_admin_login "$prod_url" "Production"
        ;;
    3)
        read -p "Enter your custom URL: " custom_url
        echo "📍 Testing Custom URL..."
        test_admin_init "$custom_url" "Custom"
        echo ""
        test_admin_login "$custom_url" "Custom"
        ;;
    4)
        echo "📍 Testing Local Development..."
        test_admin_init "http://localhost:8000" "Local"
        echo ""
        test_admin_login "http://localhost:8000" "Local"
        echo ""
        echo "📍 Testing Production..."
        read -p "Enter your emergent.sh URL: " prod_url
        test_admin_init "$prod_url" "Production"
        echo ""
        test_admin_login "$prod_url" "Production"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Next Steps:"
echo "1. If initialization was successful, you can now login"
echo "2. Go to your application URL"
echo "3. Login with: galburdumitru1@gmail.com / Anestezie130697"
echo "4. Look for the 'Admin Panel' button in your app"
echo "5. Enjoy your admin features! 🎉"