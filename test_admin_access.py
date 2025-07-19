#!/usr/bin/env python3
"""
Test Admin Access Script
Verifies admin account setup and IP security functionality
"""

import os
import sys
import asyncio
import requests
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import get_database
from backend.middleware.ip_security import IPSecurityMiddleware

# Load test configuration from environment variables
def load_test_config():
    """Load test configuration from environment variables"""
    from dotenv import load_dotenv
    import os
    
    # Load .env.admin file if it exists
    load_dotenv('.env.admin')
    
    admin_email = os.getenv('ADMIN_EMAIL')
    admin_password = os.getenv('ADMIN_PASSWORD')
    allowed_ips_str = os.getenv('ADMIN_ALLOWED_IPS', '')
    
    if not admin_email or not admin_password:
        raise ValueError(
            "Admin credentials not found in environment variables. "
            "Please create a .env.admin file with ADMIN_EMAIL and ADMIN_PASSWORD"
        )
    
    allowed_ips = [ip.strip() for ip in allowed_ips_str.split(',') if ip.strip()]
    
    return {
        "base_url": "http://localhost:8000",  # Adjust to your server URL
        "admin_email": admin_email,
        "admin_password": admin_password,
        "test_ips": allowed_ips + ["192.168.1.1", "8.8.8.8"]  # Add test IPs
    }

# Load test configuration
try:
    TEST_CONFIG = load_test_config()
except Exception as e:
    print(f"❌ Error loading test configuration: {e}")
    print("Please create a .env.admin file with the required credentials")
    sys.exit(1)

class AdminAccessTester:
    def __init__(self):
        self.db = None
        self.ip_security = IPSecurityMiddleware()
        self.session = requests.Session()
    
    async def initialize_database(self):
        """Initialize database connection"""
        try:
            # Get database connection properly
            db_gen = get_database()
            self.db = await db_gen.__anext__()
        except Exception as e:
            print(f"Error initializing database: {e}")
            raise
    
    async def test_admin_user_exists(self):
        """Test if admin user exists in database"""
        print("🔍 Testing admin user existence...")
        
        try:
            admin_user = await self.db.users.find_one({"email": TEST_CONFIG["admin_email"].lower()})
            
            if admin_user:
                print(f"✅ Admin user found: {admin_user['email']}")
                print(f"   Admin status: {admin_user.get('is_admin', False)}")
                print(f"   Role: {admin_user.get('role', 'user')}")
                print(f"   Created: {admin_user.get('created_at')}")
                return True
            else:
                print("❌ Admin user not found in database")
                return False
                
        except Exception as e:
            print(f"❌ Error checking admin user: {e}")
            return False
    
    async def test_ip_security_config(self):
        """Test IP security configuration"""
        print("\n🔒 Testing IP security configuration...")
        
        try:
            ip_config = await self.db.admin_security_config.find_one({"admin_email": TEST_CONFIG["admin_email"]})
            
            if ip_config:
                print(f"✅ IP security config found for: {ip_config['admin_email']}")
                print(f"   Allowed IPs: {ip_config.get('allowed_ips', [])}")
                print(f"   Created: {ip_config.get('created_at')}")
                return True
            else:
                print("❌ IP security configuration not found")
                return False
                
        except Exception as e:
            print(f"❌ Error checking IP security config: {e}")
            return False
    
    async def test_ip_verification(self):
        """Test IP verification functionality"""
        print("\n🌐 Testing IP verification...")
        
        try:
            await self.ip_security.initialize_database()
            
            for test_ip in TEST_CONFIG["test_ips"]:
                is_allowed = await self.ip_security.is_admin_ip_allowed(
                    TEST_CONFIG["admin_email"], 
                    test_ip
                )
                
                status = "✅ ALLOWED" if is_allowed else "❌ DENIED"
                print(f"   {test_ip}: {status}")
                
        except Exception as e:
            print(f"❌ Error testing IP verification: {e}")
            return False
        
        return True
    
    async def test_admin_login(self):
        """Test admin login functionality"""
        print("\n🔐 Testing admin login...")
        
        try:
            login_data = {
                "email": TEST_CONFIG["admin_email"],
                "password": TEST_CONFIG["admin_password"]
            }
            
            response = self.session.post(
                f"{TEST_CONFIG['base_url']}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                token_data = response.json()
                print("✅ Admin login successful")
                print(f"   Token type: {token_data.get('token_type')}")
                print(f"   User role: {token_data.get('user', {}).get('role')}")
                print(f"   Is admin: {token_data.get('user', {}).get('is_admin')}")
                
                # Store token for further tests
                self.session.headers.update({
                    "Authorization": f"Bearer {token_data['access_token']}"
                })
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing admin login: {e}")
            return False
    
    async def test_admin_endpoints(self):
        """Test admin endpoint access"""
        print("\n📊 Testing admin endpoints...")
        
        try:
            # Test admin stats endpoint
            response = self.session.get(f"{TEST_CONFIG['base_url']}/admin/stats")
            
            if response.status_code == 200:
                stats_data = response.json()
                print("✅ Admin stats endpoint accessible")
                print(f"   Total users: {stats_data.get('total_users', 0)}")
                print(f"   Active subscriptions: {stats_data.get('active_subscriptions', 0)}")
                print(f"   Total revenue: {stats_data.get('total_revenue', 0)}")
            else:
                print(f"❌ Admin stats endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
            
            # Test admin users endpoint
            response = self.session.get(f"{TEST_CONFIG['base_url']}/admin/users")
            
            if response.status_code == 200:
                users_data = response.json()
                print("✅ Admin users endpoint accessible")
                print(f"   Users returned: {len(users_data)}")
            else:
                print(f"❌ Admin users endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing admin endpoints: {e}")
            return False
        
        return True
    
    async def test_audit_logging(self):
        """Test audit logging functionality"""
        print("\n📝 Testing audit logging...")
        
        try:
            # Check for recent audit logs
            recent_logs = await self.db.audit_logs.find({
                "user_id": {"$regex": TEST_CONFIG["admin_email"]},
                "timestamp": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0)}
            }).to_list(10)
            
            if recent_logs:
                print(f"✅ Audit logs found: {len(recent_logs)} recent entries")
                for log in recent_logs[:3]:  # Show first 3
                    print(f"   - {log.get('action')} at {log.get('timestamp')}")
            else:
                print("⚠️  No recent audit logs found")
            
            # Check for admin access logs
            access_logs = await self.db.admin_access_logs.find({
                "admin_email": TEST_CONFIG["admin_email"]
            }).to_list(5)
            
            if access_logs:
                print(f"✅ Admin access logs found: {len(access_logs)} entries")
            else:
                print("⚠️  No admin access logs found")
                
        except Exception as e:
            print(f"❌ Error testing audit logging: {e}")
            return False
        
        return True
    
    def generate_test_report(self, results):
        """Generate test report"""
        print("\n" + "="*50)
        print("📋 ADMIN ACCESS TEST REPORT")
        print("="*50)
        
        total_tests = len(results)
        passed_tests = sum(1 for result in results.values() if result)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\nDetailed Results:")
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {test_name}: {status}")
        
        if passed_tests == total_tests:
            print("\n🎉 All tests passed! Admin setup is working correctly.")
        else:
            print("\n⚠️  Some tests failed. Please review the setup.")
        
        print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

async def main():
    """Main test function"""
    print("🧪 FSP Navigator Admin Access Test")
    print("="*50)
    
    tester = AdminAccessTester()
    results = {}
    
    try:
        # Initialize database
        await tester.initialize_database()
        
        # Run tests
        results["Admin User Exists"] = await tester.test_admin_user_exists()
        results["IP Security Config"] = await tester.test_ip_security_config()
        results["IP Verification"] = await tester.test_ip_verification()
        results["Admin Login"] = await tester.test_admin_login()
        results["Admin Endpoints"] = await tester.test_admin_endpoints()
        results["Audit Logging"] = await tester.test_audit_logging()
        
        # Generate report
        tester.generate_test_report(results)
        
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        return

if __name__ == "__main__":
    asyncio.run(main())