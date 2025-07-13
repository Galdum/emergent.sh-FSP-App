import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import secrets
import hashlib
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import re
from typing import Optional, List

# Encryption and Security Utilities

class DataEncryption:
    def __init__(self):
        self.encryption_key = self._get_or_create_key()
        self.fernet = Fernet(self.encryption_key)
    
    def _get_or_create_key(self):
        """Get encryption key from environment or generate new one"""
        # Try to get key from environment first
        env_key = os.environ.get('ENCRYPTION_KEY')
        if env_key:
            return env_key.encode()
        
        # For development only - in production, key should be in environment
        if os.environ.get('ENVIRONMENT') == 'development':
            key_file = os.path.join(os.path.dirname(__file__), '.encryption_key')
            
            if os.path.exists(key_file):
                with open(key_file, "rb") as f:
                    return f.read()
            else:
                # Generate new key
                key = Fernet.generate_key()
                with open(key_file, "wb") as f:
                    f.write(key)
                os.chmod(key_file, 0o600)  # Restrict file permissions
                return key
        else:
            raise ValueError("ENCRYPTION_KEY environment variable must be set in production")
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        if not data:
            return data
        
        encrypted = self.fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        if not encrypted_data:
            return encrypted_data
        
        try:
            decoded = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.fernet.decrypt(decoded)
            return decrypted.decode()
        except Exception:
            return encrypted_data  # Return as-is if decryption fails
    
    def encrypt_file_content(self, file_content: bytes) -> str:
        """Encrypt file content"""
        encrypted = self.fernet.encrypt(file_content)
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt_file_content(self, encrypted_content: str) -> bytes:
        """Decrypt file content"""
        decoded = base64.urlsafe_b64decode(encrypted_content.encode())
        return self.fernet.decrypt(decoded)

class SecurityManager:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.encryptor = DataEncryption()
    
    def hash_password(self, password: str) -> str:
        """Hash password securely"""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure random token"""
        return secrets.token_urlsafe(length)
    
    def hash_pii(self, pii_data: str) -> str:
        """Hash PII data for anonymization"""
        salt = os.environ.get('ENCRYPTION_SALT', 'default-salt')
        return hashlib.sha256(f"{pii_data}{salt}".encode()).hexdigest()
    
    def create_jwt_token(self, data: dict, expires_delta: timedelta = None) -> str:
        """Create JWT token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=24)
        
        to_encode.update({"exp": expire})
        
        # Get secret from environment - no fallback
        secret_key = os.environ.get("JWT_SECRET_KEY")
        if not secret_key:
            raise ValueError("JWT_SECRET_KEY environment variable must be set")
            
        return jwt.encode(to_encode, secret_key, algorithm="HS256")
    
    def verify_jwt_token(self, token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            secret_key = os.environ.get("JWT_SECRET_KEY")
            if not secret_key:
                raise ValueError("JWT_SECRET_KEY environment variable must be set")
                
            payload = jwt.decode(token, secret_key, algorithms=["HS256"])
            return payload
        except jwt.PyJWTError:
            return None

class AuditLogger:
    def __init__(self, db):
        self.db = db
    
    async def log_action(self, user_id: str, action: str, details: dict = None, ip_address: str = None):
        """Log user action for audit trail"""
        log_entry = {
            "user_id": user_id,
            "action": action,
            "details": details or {},
            "timestamp": datetime.utcnow(),
            "ip_address": self.anonymize_ip(ip_address) if ip_address else None,
            "session_id": details.get("session_id") if details else None
        }
        
        await self.db.audit_logs.insert_one(log_entry)
    
    async def log_data_access(self, user_id: str, data_type: str, operation: str, ip_address: str = None):
        """Log data access for compliance"""
        await self.log_action(
            user_id=user_id,
            action="data_access",
            details={
                "data_type": data_type,
                "operation": operation,
                "compliance_log": True
            },
            ip_address=ip_address
        )
    
    async def log_privacy_action(self, user_id: str, action: str, details: dict, ip_address: str = None):
        """Log privacy-related actions (consent, data export, deletion)"""
        await self.log_action(
            user_id=user_id,
            action=f"privacy_{action}",
            details={
                **details,
                "gdpr_compliance": True,
                "retention_period": "permanent"
            },
            ip_address=ip_address
        )
    
    @staticmethod
    def anonymize_ip(ip_address: str) -> str:
        """Anonymize IP address for privacy"""
        if ":" in ip_address:  # IPv6
            # Keep only the first 3 segments
            parts = ip_address.split(":")[:3]
            return ":".join(parts) + "::/48"
        else:  # IPv4
            # Zero out last octet
            parts = ip_address.split(".")
            parts[-1] = "0"
            return ".".join(parts)

# Data anonymization utilities
class DataAnonymizer:
    @staticmethod
    def anonymize_email(email: str) -> str:
        """Anonymize email for analytics"""
        username, domain = email.split("@")
        # Keep first 2 chars and hash the rest
        if len(username) <= 2:
            anon_username = "***"
        else:
            anon_username = username[:2] + "***"
        return f"{anon_username}@{domain}"
    
    @staticmethod
    def anonymize_ip(ip_address: str) -> str:
        """Anonymize IP address using proper method"""
        return AuditLogger.anonymize_ip(ip_address)
    
    @staticmethod
    def create_user_hash(user_id: str, salt: str = None) -> str:
        """Create consistent hash for user analytics"""
        if not salt:
            salt = os.environ.get("ANALYTICS_SALT", "default-salt")
        return hashlib.sha256(f"{user_id}{salt}".encode()).hexdigest()[:16]

# Security middleware functions
def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded filename"""
    # Remove path separators and dangerous characters
    filename = os.path.basename(filename)
    # Remove potentially dangerous characters
    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    # Ensure it has a proper extension
    if '.' not in safe_filename:
        safe_filename = safe_filename + '.bin'
    return safe_filename[:100]  # Limit length

def validate_file_type(filename: str, allowed_types: List[str]) -> bool:
    """Validate file type"""
    file_ext = filename.split('.')[-1].lower()
    return file_ext in allowed_types

def check_file_size(file_size: int, max_size_mb: int = None) -> bool:
    """Check if file size is within limits"""
    if max_size_mb is None:
        max_size_mb = int(os.environ.get('MAX_FILE_SIZE_MB', 10))
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes

def get_allowed_file_types() -> List[str]:
    """Get allowed file types from environment"""
    allowed_types = os.environ.get('ALLOWED_FILE_TYPES', 'pdf,jpg,jpeg,png,doc,docx')
    return [ext.strip() for ext in allowed_types.split(',')]

# Rate limiting utilities
class RateLimiter:
    def __init__(self):
        self.requests = {}
        self.cleanup_counter = 0
    
    def is_allowed(self, identifier: str, max_requests: int = 100, window_minutes: int = 60) -> bool:
        """Check if request is within rate limit"""
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=window_minutes)
        
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Remove old requests
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if req_time > window_start
        ]
        
        # Periodic cleanup to prevent memory leak
        self.cleanup_counter += 1
        if self.cleanup_counter > 1000:
            self._cleanup_old_entries(window_start)
            self.cleanup_counter = 0
        
        # Check if under limit
        if len(self.requests[identifier]) < max_requests:
            self.requests[identifier].append(now)
            return True
        
        return False
    
    def _cleanup_old_entries(self, cutoff_time: datetime):
        """Remove entries older than cutoff time"""
        identifiers_to_remove = []
        for identifier, timestamps in self.requests.items():
            if not timestamps or max(timestamps) < cutoff_time:
                identifiers_to_remove.append(identifier)
        
        for identifier in identifiers_to_remove:
            del self.requests[identifier]

# Input validation utilities
def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def sanitize_regex_pattern(pattern: str) -> str:
    """Sanitize regex pattern to prevent ReDoS attacks"""
    # Escape special regex characters
    return re.escape(pattern)

def validate_bundesland(bundesland: str) -> bool:
    """Validate German federal state"""
    valid_bundeslaender = [
        "baden-wuerttemberg", "bayern", "berlin", "brandenburg",
        "bremen", "hamburg", "hessen", "mecklenburg-vorpommern",
        "niedersachsen", "nordrhein-westfalen", "rheinland-pfalz",
        "saarland", "sachsen", "sachsen-anhalt", "schleswig-holstein",
        "thueringen"
    ]
    return bundesland.lower() in valid_bundeslaender

# Initialize global instances
security_manager = SecurityManager()
data_encryption = DataEncryption()
rate_limiter = RateLimiter()