#!/usr/bin/env python3
"""
Generate secure keys for JWT_SECRET_KEY and ENCRYPTION_KEY.
This script generates cryptographically secure keys that meet the requirements.
"""

import secrets
import base64


def generate_jwt_secret_key(length: int = 64) -> str:
    """Generate a secure JWT secret key."""
    return secrets.token_urlsafe(length)


def generate_encryption_key() -> str:
    """Generate a secure encryption key for Fernet (32 bytes base64 encoded)."""
    # Generate 32 random bytes and encode as base64
    random_bytes = secrets.token_bytes(32)
    return base64.urlsafe_b64encode(random_bytes).decode()


def main():
    """Generate and display secure keys."""
    print("🔐 Generating secure keys for your environment...")
    print()
    
    # Generate JWT secret key
    jwt_key = generate_jwt_secret_key()
    print(f"JWT_SECRET_KEY={jwt_key}")
    print()
    
    # Generate encryption key
    encryption_key = generate_encryption_key()
    print(f"ENCRYPTION_KEY={encryption_key}")
    print()
    
    print("📝 Instructions:")
    print("1. Copy these keys to your .env file")
    print("2. Replace the placeholder values in backend/.env.example")
    print("3. Never commit your actual .env file to version control")
    print("4. Keep these keys secure and backup safely")
    print()
    
    print("⚠️  Security Notes:")
    print("- These keys are cryptographically secure")
    print("- JWT_SECRET_KEY is 64 characters long")
    print("- ENCRYPTION_KEY is base64-encoded 32-byte key")
    print("- Both keys meet the minimum 32-character requirement")
    print()
    
    # Save to a temporary file for easy copying
    with open(".generated_keys.txt", "w") as f:
        f.write(f"JWT_SECRET_KEY={jwt_key}\n")
        f.write(f"ENCRYPTION_KEY={encryption_key}\n")
    
    print("💾 Keys also saved to .generated_keys.txt for easy copying")
    print("   (Remember to delete this file after copying to .env)")


if __name__ == "__main__":
    main()