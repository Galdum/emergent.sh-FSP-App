#!/usr/bin/env python3
"""
Secure Admin Account Setup Script
This script sets up admin access for the specified email with IP-based security.
"""

import os
import sys
import asyncio
import ipaddress
from datetime import datetime, timedelta
from typing import List, Optional
import hashlib
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import get_database
from backend.auth import get_password_hash
from backend.models import UserInDB, User
from backend.security import AuditLogger

# Admin Configuration (SECURE - DO NOT SHARE)
ADMIN_CONFIG = {
    "email": "galburdumitru1@gmail.com",
    "password": "Anestezie130697",  # Should be changed to a stronger password
    "allowed_ips": [
        "37.4.249.169",
        "80.187.118.113/32"
    ],
    "admin_granted_by": "system_setup",
    "admin_granted_at": datetime.utcnow()
}

# Security settings
SECURITY_CONFIG = {
    "max_login_attempts": 3,
    "lockout_duration_minutes": 30,
    "session_timeout_hours": 24,
    "require_ip_verification": True
}

class AdminSetupManager:
    def __init__(self):
        self.db = None
        self.audit_logger = None
    
    async def initialize_database(self):
        """Initialize database connection"""
        self.db = await get_database().__anext__()
        self.audit_logger = AuditLogger(self.db)
    
    def validate_ip_address(self, ip_str: str) -> bool:
        """Validate IP address format"""
        try:
            ipaddress.ip_network(ip_str, strict=False)
            return True
        except ValueError:
            return False
    
    def is_ip_allowed(self, client_ip: str) -> bool:
        """Check if client IP is in allowed list"""
        try:
            client_ip_obj = ipaddress.ip_address(client_ip)
            for allowed_ip in ADMIN_CONFIG["allowed_ips"]:
                network = ipaddress.ip_network(allowed_ip, strict=False)
                if client_ip_obj in network:
                    return True
            return False
        except ValueError:
            return False
    
    async def create_or_update_admin_user(self) -> bool:
        """Create or update admin user with secure settings"""
        try:
            # Check if user already exists
            existing_user = await self.db.users.find_one({"email": ADMIN_CONFIG["email"].lower()})
            
            if existing_user:
                print(f"✅ User {ADMIN_CONFIG['email']} already exists")
                
                # Update admin privileges if not already admin
                if not existing_user.get("is_admin", False):
                    await self.db.users.update_one(
                        {"email": ADMIN_CONFIG["email"].lower()},
                        {"$set": {
                            "is_admin": True,
                            "role": "admin",
                            "admin_granted_by": ADMIN_CONFIG["admin_granted_by"],
                            "admin_granted_at": ADMIN_CONFIG["admin_granted_at"],
                            "updated_at": datetime.utcnow()
                        }}
                    )
                    print("✅ Admin privileges granted")
                else:
                    print("✅ User already has admin privileges")
                
                # Update password if needed
                await self.db.users.update_one(
                    {"email": ADMIN_CONFIG["email"].lower()},
                    {"$set": {
                        "password_hash": get_password_hash(ADMIN_CONFIG["password"]),
                        "updated_at": datetime.utcnow()
                    }}
                )
                print("✅ Password updated")
                
            else:
                # Create new admin user
                user = User(
                    email=ADMIN_CONFIG["email"].lower(),
                    first_name="Admin",
                    last_name="User",
                    is_admin=True,
                    role="admin",
                    email_verified=True,
                    profile_completed=True
                )
                
                user_in_db = UserInDB(
                    **user.dict(),
                    password_hash=get_password_hash(ADMIN_CONFIG["password"]),
                    admin_granted_by=ADMIN_CONFIG["admin_granted_by"],
                    admin_granted_at=ADMIN_CONFIG["admin_granted_at"],
                    subscription_tier="PREMIUM",
                    subscription_expires=datetime.utcnow() + timedelta(days=365*10)  # 10 years
                )
                
                await self.db.users.insert_one(user_in_db.dict())
                print(f"✅ Admin user {ADMIN_CONFIG['email']} created successfully")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating/updating admin user: {e}")
            return False
    
    async def setup_ip_security(self) -> bool:
        """Set up IP-based security configuration"""
        try:
            # Store IP security configuration
            ip_security_config = {
                "admin_email": ADMIN_CONFIG["email"],
                "allowed_ips": ADMIN_CONFIG["allowed_ips"],
                "security_settings": SECURITY_CONFIG,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Store in database (encrypted in production)
            await self.db.admin_security_config.update_one(
                {"admin_email": ADMIN_CONFIG["email"]},
                {"$set": ip_security_config},
                upsert=True
            )
            
            print("✅ IP security configuration saved")
            return True
            
        except Exception as e:
            print(f"❌ Error setting up IP security: {e}")
            return False
    
    async def create_admin_audit_log(self) -> bool:
        """Create audit log entry for admin setup"""
        try:
            await self.audit_logger.log_action(
                user_id="system_setup",
                action="admin_account_created",
                details={
                    "admin_email": ADMIN_CONFIG["email"],
                    "allowed_ips": ADMIN_CONFIG["allowed_ips"],
                    "setup_timestamp": datetime.utcnow().isoformat(),
                    "security_level": "high"
                }
            )
            print("✅ Admin setup audit log created")
            return True
            
        except Exception as e:
            print(f"❌ Error creating audit log: {e}")
            return False
    
    async def validate_setup(self) -> bool:
        """Validate the admin setup"""
        try:
            # Check if admin user exists and has correct privileges
            admin_user = await self.db.users.find_one({"email": ADMIN_CONFIG["email"].lower()})
            if not admin_user:
                print("❌ Admin user not found")
                return False
            
            if not admin_user.get("is_admin", False):
                print("❌ Admin user doesn't have admin privileges")
                return False
            
            # Check if IP security config exists
            ip_config = await self.db.admin_security_config.find_one({"admin_email": ADMIN_CONFIG["email"]})
            if not ip_config:
                print("❌ IP security configuration not found")
                return False
            
            print("✅ Admin setup validation passed")
            return True
            
        except Exception as e:
            print(f"❌ Error validating setup: {e}")
            return False
    
    def generate_security_report(self) -> dict:
        """Generate security report for admin setup"""
        return {
            "admin_email": ADMIN_CONFIG["email"],
            "allowed_ips": ADMIN_CONFIG["allowed_ips"],
            "security_features": [
                "IP-based access control",
                "Password hashing with bcrypt",
                "Session-based authentication",
                "Audit logging",
                "Rate limiting",
                "Account lockout protection"
            ],
            "recommendations": [
                "Change password to a stronger one",
                "Use HTTPS in production",
                "Enable two-factor authentication",
                "Regular security audits",
                "Monitor access logs"
            ],
            "setup_timestamp": datetime.utcnow().isoformat()
        }

async def main():
    """Main setup function"""
    print("🔐 FSP Navigator Admin Account Setup")
    print("=" * 50)
    
    # Validate IP addresses
    print("🔍 Validating IP addresses...")
    for ip in ADMIN_CONFIG["allowed_ips"]:
        if not AdminSetupManager().validate_ip_address(ip):
            print(f"❌ Invalid IP address: {ip}")
            return
        print(f"✅ Valid IP: {ip}")
    
    # Initialize setup manager
    setup_manager = AdminSetupManager()
    
    try:
        # Initialize database
        print("\n📊 Initializing database connection...")
        await setup_manager.initialize_database()
        
        # Create/update admin user
        print("\n👤 Setting up admin user...")
        if not await setup_manager.create_or_update_admin_user():
            return
        
        # Setup IP security
        print("\n🔒 Setting up IP-based security...")
        if not await setup_manager.setup_ip_security():
            return
        
        # Create audit log
        print("\n📝 Creating audit log...")
        if not await setup_manager.create_admin_audit_log():
            return
        
        # Validate setup
        print("\n✅ Validating setup...")
        if not await setup_manager.validate_setup():
            return
        
        # Generate security report
        print("\n📋 Security Report:")
        print("=" * 50)
        security_report = setup_manager.generate_security_report()
        
        print(f"Admin Email: {security_report['admin_email']}")
        print(f"Allowed IPs: {', '.join(security_report['allowed_ips'])}")
        print(f"Setup Time: {security_report['setup_timestamp']}")
        
        print("\n🔒 Security Features:")
        for feature in security_report['security_features']:
            print(f"  ✅ {feature}")
        
        print("\n💡 Security Recommendations:")
        for rec in security_report['recommendations']:
            print(f"  📌 {rec}")
        
        print("\n🎉 Admin account setup completed successfully!")
        print("\n⚠️  IMPORTANT SECURITY NOTES:")
        print("1. Change the default password immediately after first login")
        print("2. Keep your IP addresses secure and private")
        print("3. Monitor access logs regularly")
        print("4. Use HTTPS in production environment")
        
        # Save security report to file
        with open("admin_security_report.json", "w") as f:
            json.dump(security_report, f, indent=2, default=str)
        print("\n📄 Security report saved to: admin_security_report.json")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        return

if __name__ == "__main__":
    asyncio.run(main())