# 🔑 Admin Setup Guide - Your Credentials

## 📋 **Your Admin Credentials**

- **Admin Email**: `galburdumitru1@gmail.com`
- **Admin Password**: `Anestezie130697`

---

## 🚀 **Setup Instructions**

### **Option 1: emergent.sh Deployment (Recommended)**

1. **Set Environment Variables in emergent.sh Dashboard:**
   ```env
   ADMIN_EMAIL=galburdumitru1@gmail.com
   ADMIN_PASSWORD=Anestezie130697
   JWT_SECRET_KEY=your-long-secure-jwt-secret-for-production
   MONGO_URL=your-mongodb-connection-string
   DB_NAME=fsp_navigator
   ```

2. **Deploy your application:**
   ```bash
   git add .
   git commit -m "Configure admin credentials"
   git push origin main
   ```

3. **Initialize admin after deployment:**
   ```bash
   # Replace YOUR_APP_URL with your actual emergent.sh URL
   curl -X POST https://YOUR_APP_URL/api/admin/initialize-admin
   ```

4. **Login to your application:**
   - Go to your deployed app
   - Login with: `galburdumitru1@gmail.com` / `Anestezie130697`
   - Click "Admin Panel" button to access admin features

### **Option 2: Local Development**

1. **Your environment is already configured** - the `.env` file has been created with your credentials

2. **Start the application:**
   ```bash
   # Start backend
   cd backend
   python -m uvicorn server:app --reload

   # Start frontend (in new terminal)
   cd frontend
   npm start
   ```

3. **Initialize admin:**
   ```bash
   curl -X POST http://localhost:8000/api/admin/initialize-admin
   ```

4. **Login:**
   - Go to http://localhost:3000
   - Login with: `galburdumitru1@gmail.com` / `Anestezie130697`
   - Access admin panel

---

## 🔐 **Security Notes**

- ✅ **Environment files configured** with your credentials
- ✅ **Password strength**: Your password meets security requirements
- ⚠️ **Production security**: Consider using even stronger passwords for production
- ✅ **Audit logging**: All admin actions will be tracked

---

## 🎯 **What Happens Next**

1. **First Login**: You'll see the admin tutorial
2. **Admin Panel Access**: Full dashboard with all features
3. **User Management**: You can promote other users to admin
4. **System Control**: Complete control over your FSP Navigator app

---

## 📞 **Quick Test Commands**

### **Check if admin initialization worked:**
```bash
# For local development
curl -X POST http://localhost:8000/api/admin/initialize-admin

# For emergent.sh (replace with your URL)
curl -X POST https://your-app.emergent.sh/api/admin/initialize-admin
```

### **Expected Response:**
```json
{"message": "Admin user initialized successfully"}
```

---

## 🔧 **Troubleshooting**

### **If admin initialization fails:**
1. Check that environment variables are set correctly
2. Verify database connection is working
3. Check application logs for errors

### **If login doesn't work:**
1. Verify you're using the correct email/password
2. Check that initialization was successful
3. Clear browser cache and try again

---

## ✅ **You're Ready!**

Your admin credentials are configured and ready to use. The admin panel includes:

- **Dashboard** with real-time statistics
- **User Management** with full control
- **Payment Monitoring** and analytics
- **Content Management** system
- **Error Tracking** and resolution
- **Export Tools** for data backup

**Next step**: Deploy to emergent.sh or start locally and initialize your admin account! 🎉