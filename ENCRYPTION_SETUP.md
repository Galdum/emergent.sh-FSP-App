# 🔐 Encryption Key Setup Guide

## Quick Setup (No Coding Required)

If you're not comfortable with coding, here's the simplest way to set up your encryption key:

### Option 1: Run the Automatic Setup Script

1. **Open your terminal/command prompt**
2. **Navigate to your project folder** (where this README is located)
3. **Run this command:**
   ```bash
   python setup_encryption_key.py
   ```

That's it! The script will automatically:
- ✅ Generate a secure encryption key
- ✅ Add it to your `.env` file
- ✅ Create a backup copy for safekeeping

### Option 2: Manual Setup (If the script doesn't work)

If you can't run the script, here's the manual way:

1. **Open your `.env` file** (create it if it doesn't exist)
2. **Add this line to the file:**
   ```
   ENCRYPTION_KEY=your-generated-key-here
   ```
3. **Replace `your-generated-key-here`** with a key from one of these sources:
   - Ask your developer/team lead for a key
   - Use an online Fernet key generator (search "Fernet key generator")
   - Copy this example key (for development only): `dGVzdC1rZXktZm9yLWRldmVsb3BtZW50LW9ubHk=`

## 🔒 Security Notes

- **Keep your `.env` file secure** - don't share it or commit it to version control
- **The backup file** (`.encryption_key_backup.txt`) contains your key - keep it safe
- **If you lose the key**, any encrypted data cannot be recovered
- **This is for development only** - production environments should use proper secret management

## 🚨 What Happens If You Don't Set This Up?

- The application will show an error message when it starts
- No data will be encrypted (which might be okay for development)
- You'll need to set the key before using any encryption features

## ✅ How to Verify It's Working

After setting up the key, restart your application. If it starts without encryption-related errors, you're all set!

---

**Need help?** Ask your development team or contact support. This setup is required for the application to work properly with encrypted data.