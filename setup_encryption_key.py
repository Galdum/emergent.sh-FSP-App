#!/usr/bin/env python3
"""
Simple script to automatically set up encryption key for development.
This script will:
1. Generate a secure encryption key
2. Add it to your .env file
3. Create a backup of the key for safekeeping
"""

import os
import base64
import re
from pathlib import Path

# Try to import Fernet, fallback to manual key generation if not available
try:
    from cryptography.fernet import Fernet
    FERNET_AVAILABLE = True
except ImportError:
    FERNET_AVAILABLE = False

def generate_encryption_key():
    """Generate a secure Fernet key"""
    if FERNET_AVAILABLE:
        return Fernet.generate_key()
    else:
        # Fallback: generate a 32-byte key and encode it as base64
        key_bytes = os.urandom(32)
        return base64.urlsafe_b64encode(key_bytes)

def setup_encryption_key():
    """Set up encryption key automatically"""
    print("🔐 Setting up encryption key for development...")
    
    # Generate a secure key
    key = generate_encryption_key()
    key_str = key.decode()
    
    # Check if .env file exists
    env_file = Path('.env')
    if not env_file.exists():
        print("📝 Creating .env file...")
        env_file.touch()
    
    # Read existing .env content
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Check if ENCRYPTION_KEY already exists using proper regex
    # This pattern matches ENCRYPTION_KEY= at the start of a line (after optional whitespace)
    # and ignores commented lines or other variables that might contain the string
    encryption_key_pattern = r'^\s*ENCRYPTION_KEY\s*='
    if re.search(encryption_key_pattern, content, re.MULTILINE):
        print("⚠️  ENCRYPTION_KEY already exists in .env file")
        print("   If you want to regenerate it, please remove the existing line manually.")
        print("   Or run this script with --force to update the existing key.")
        return
    
    # Add the encryption key to .env file
    with open(env_file, 'a') as f:
        f.write(f'\n# Encryption key for data encryption\nENCRYPTION_KEY={key_str}\n')
    
    # Create a backup file with the key
    backup_file = Path('.encryption_key_backup.txt')
    with open(backup_file, 'w') as f:
        f.write(f"ENCRYPTION_KEY={key_str}\n")
        f.write("\n# IMPORTANT: Keep this file safe!\n")
        f.write("# If you lose this key, you won't be able to decrypt any encrypted data.\n")
        f.write("# This is just a backup - the key is also stored in your .env file.\n")
    
    # Set restrictive permissions on backup file
    os.chmod(backup_file, 0o600)
    
    print("✅ Encryption key setup complete!")
    print(f"📁 Key added to: {env_file}")
    print(f"💾 Backup created: {backup_file}")
    print("\n🔒 Security notes:")
    print("   - The key is stored in your .env file")
    print("   - A backup copy is saved as .encryption_key_backup.txt")
    print("   - Keep both files secure and don't commit them to version control")
    print("   - If you lose this key, encrypted data cannot be recovered")

def update_existing_key():
    """Update existing ENCRYPTION_KEY in .env file"""
    print("🔄 Updating existing encryption key...")
    
    # Generate a new secure key
    key = generate_encryption_key()
    key_str = key.decode()
    
    env_file = Path('.env')
    if not env_file.exists():
        print("❌ .env file does not exist. Run without --force to create it.")
        return
    
    # Read existing .env content
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Replace existing ENCRYPTION_KEY line
    encryption_key_pattern = r'^\s*ENCRYPTION_KEY\s*=.*$'
    new_content = re.sub(encryption_key_pattern, f'ENCRYPTION_KEY={key_str}', content, flags=re.MULTILINE)
    
    # Write updated content
    with open(env_file, 'w') as f:
        f.write(new_content)
    
    # Create backup
    backup_file = Path('.encryption_key_backup.txt')
    with open(backup_file, 'w') as f:
        f.write(f"ENCRYPTION_KEY={key_str}\n")
        f.write("\n# IMPORTANT: Keep this file safe!\n")
        f.write("# If you lose this key, you won't be able to decrypt any encrypted data.\n")
        f.write("# This is just a backup - the key is also stored in your .env file.\n")
    
    os.chmod(backup_file, 0o600)
    
    print("✅ Encryption key updated successfully!")
    print(f"📁 Key updated in: {env_file}")
    print(f"💾 Backup created: {backup_file}")

if __name__ == "__main__":
    import sys
    
    try:
        if len(sys.argv) > 1 and sys.argv[1] == '--force':
            update_existing_key()
        else:
            setup_encryption_key()
    except Exception as e:
        print(f"❌ Error setting up encryption key: {e}")
        print("Please make sure you have the required permissions to write files.")