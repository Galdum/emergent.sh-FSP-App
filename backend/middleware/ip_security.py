"""
IP Security Middleware
Provides IP-based access control for admin functions
"""

import ipaddress
from typing import Optional, List
from fastapi import Request, HTTPException, status
from backend.database import get_database
from backend.models import UserInDB
from datetime import datetime

class IPSecurityMiddleware:
    def __init__(self):
        self.db = None
    
    async def initialize_database(self):
        """Initialize database connection"""
        if not self.db:
            self.db = await get_database().__anext__()
    
    def validate_ip_address(self, ip_str: str) -> bool:
        """Validate IP address format"""
        try:
            ipaddress.ip_network(ip_str, strict=False)
            return True
        except ValueError:
            return False
    
    async def is_admin_ip_allowed(self, admin_email: str, client_ip: str) -> bool:
        """Check if admin's client IP is in allowed list"""
        try:
            await self.initialize_database()
            
            # Get admin security configuration
            ip_config = await self.db.admin_security_config.find_one({"admin_email": admin_email})
            if not ip_config:
                return False  # No IP restrictions configured
            
            allowed_ips = ip_config.get("allowed_ips", [])
            if not allowed_ips:
                return True  # No IP restrictions
            
            # Check if client IP is in allowed list
            try:
                client_ip_obj = ipaddress.ip_address(client_ip)
                for allowed_ip in allowed_ips:
                    network = ipaddress.ip_network(allowed_ip, strict=False)
                    if client_ip_obj in network:
                        return True
                return False
            except ValueError:
                return False
                
        except Exception as e:
            print(f"Error checking IP access: {e}")
            return False
    
    async def verify_admin_access(self, request: Request, admin_user: UserInDB) -> bool:
        """Verify admin access with IP restrictions"""
        try:
            # Get client IP
            client_ip = self.get_client_ip(request)
            if not client_ip:
                return False
            
            # Check if admin has IP restrictions
            ip_config = await self.db.admin_security_config.find_one({"admin_email": admin_user.email})
            if not ip_config:
                return True  # No IP restrictions for this admin
            
            # Verify IP access
            return await self.is_admin_ip_allowed(admin_user.email, client_ip)
            
        except Exception as e:
            print(f"Error verifying admin access: {e}")
            return False
    
    def get_client_ip(self, request: Request) -> Optional[str]:
        """Extract client IP from request"""
        # Check for forwarded headers (common with proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        if request.client:
            return request.client.host
        
        return None
    
    async def log_admin_access_attempt(self, admin_email: str, client_ip: str, allowed: bool, request: Request = None):
        """Log admin access attempts for security monitoring"""
        try:
            await self.initialize_database()
            
            log_entry = {
                "admin_email": admin_email,
                "client_ip": client_ip,
                "allowed": allowed,
                "timestamp": datetime.utcnow(),
                "user_agent": request.headers.get("User-Agent", "") if request else "",
                "access_type": "admin_panel"
            }
            
            await self.db.admin_access_logs.insert_one(log_entry)
            
        except Exception as e:
            print(f"Error logging admin access: {e}")

# Global instance
ip_security = IPSecurityMiddleware()

async def verify_admin_ip_access(request: Request, admin_user: UserInDB) -> bool:
    """Verify admin IP access - use this in admin endpoints"""
    return await ip_security.verify_admin_access(request, admin_user)

def require_admin_ip_verification():
    """Decorator for admin endpoints that require IP verification"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request and admin_user from function arguments
            request = None
            admin_user = None
            
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                elif hasattr(arg, 'email') and hasattr(arg, 'is_admin'):
                    admin_user = arg
            
            for key, value in kwargs.items():
                if isinstance(value, Request):
                    request = value
                elif hasattr(value, 'email') and hasattr(value, 'is_admin'):
                    admin_user = value
            
            if not request or not admin_user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Request or admin user not found"
                )
            
            # Verify IP access
            if not await ip_security.verify_admin_access(request, admin_user):
                client_ip = ip_security.get_client_ip(request)
                await ip_security.log_admin_access_attempt(admin_user.email, client_ip, False)
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied from this IP address"
                )
            
            # Log successful access
            client_ip = ip_security.get_client_ip(request)
            await ip_security.log_admin_access_attempt(admin_user.email, client_ip, True)
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator