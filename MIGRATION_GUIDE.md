# 🔄 Informatii Utile Migration Guide

## **Overview**

This guide shows you how to migrate the static "Informatii Utile" content to your MongoDB database, enabling dynamic management through the admin panel.

## **✅ What's Been Prepared**

1. **Migration data generated**: `informatii_utile_migration_data.json` (6 documents ready)
2. **Admin API endpoints**: Full CRUD operations for document management
3. **Public API endpoints**: Serves content to your frontend
4. **Database model**: `UtilInfoDocument` for storing all document information

---

## **🚀 Migration Options**

### **Option 1: Direct Migration (When MongoDB is Available)**

When your MongoDB instance is running, use the automated script:

```bash
# 1. Make sure MongoDB is running
sudo systemctl start mongod
# OR using Docker:
docker run -d -p 27017:27017 --name mongodb-approbmed mongo:latest

# 2. Set environment variables
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="approbmed"
export JWT_SECRET_KEY="your-secret-key-here"

# 3. Run the migration
./run_migration.sh
```

### **Option 2: Manual Import Using MongoDB Tools**

If you prefer to import the data manually:

```bash
# 1. Import the JSON data directly into MongoDB
mongoimport --db approbmed --collection util_info_documents --file informatii_utile_migration_data.json --jsonArray

# 2. Verify the import
mongo approbmed --eval "db.util_info_documents.count()"
```

### **Option 3: Using MongoDB Compass (GUI)**

1. Open MongoDB Compass and connect to your database
2. Navigate to the `approbmed` database
3. Create a new collection called `util_info_documents`
4. Use the "Import Data" feature to import `informatii_utile_migration_data.json`

---

## **🔧 Backend Setup Requirements**

### **Environment Variables**

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
MONGO_URL=mongodb://localhost:27017
DB_NAME=approbmed
JWT_SECRET_KEY=your-secure-secret-key-here
```

### **Dependencies**

Make sure these Python packages are installed:

```bash
pip install motor python-dotenv pydantic fastapi uvicorn
```

---

## **📋 Step-by-Step Migration Process**

### **Step 1: Start Your MongoDB Instance**

Choose one of these options:

**Option A: Local MongoDB Installation**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod  # Start on boot
```

**Option B: Docker Container**
```bash
docker run -d -p 27017:27017 --name approbmed-mongo \
  -v mongodb_data:/data/db \
  mongo:latest
```

**Option C: MongoDB Atlas (Cloud)**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Update `MONGO_URL` with your connection string

### **Step 2: Verify MongoDB Connection**

```bash
# Test connection
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    try:
        await client.admin.command('ping')
        print('✅ MongoDB connection successful')
    except Exception as e:
        print(f'❌ Connection failed: {e}')

asyncio.run(test())
"
```

### **Step 3: Run the Migration**

```bash
# Option 1: Automated migration
./run_migration.sh

# Option 2: Manual migration
export PYTHONPATH="/workspace:$PYTHONPATH"
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="approbmed"
export JWT_SECRET_KEY="your-secret-key"
python3 scripts/migrate_util_info_docs.py
```

### **Step 4: Verify Migration**

```bash
# Check if documents were imported
mongo approbmed --eval "
  print('Total documents:', db.util_info_documents.count());
  print('Categories:', db.util_info_documents.distinct('category'));
"
```

---

## **🎯 Next Steps After Migration**

### **1. Update Frontend to Use Dynamic Content**

Replace the static `infoDocs` array in your frontend with API calls:

```javascript
// In your React component
const [utilInfoDocs, setUtilInfoDocs] = useState([]);

useEffect(() => {
  fetch('/api/documents/util-info')
    .then(response => response.json())
    .then(data => setUtilInfoDocs(data))
    .catch(error => console.error('Error loading util info docs:', error));
}, []);
```

### **2. Access Admin Panel**

1. Log in as admin user
2. Navigate to the admin dashboard
3. Look for "Informatii Utile Management" section
4. Start managing documents dynamically!

### **3. Remove Static Content**

Once verified that the dynamic system works:

```javascript
// Remove this static array from frontend/src/App.js
const infoDocs = [
  // ... static content
];
```

---

## **🛠️ Admin Panel Features**

After migration, admins can:

- ✅ **Add new documents** - Create information documents
- ✅ **Edit existing content** - Update text, links, categories
- ✅ **Upload files** - Attach PDF/Word documents
- ✅ **Reorder documents** - Change display priority
- ✅ **Delete outdated content** - Remove old information
- ✅ **Preview changes** - See how content appears to users

---

## **🚨 Troubleshooting**

### **MongoDB Connection Issues**

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check port availability
netstat -tlnp | grep :27017

# View MongoDB logs
sudo journalctl -u mongod -f
```

### **Permission Issues**

```bash
# Fix file permissions
chmod +x run_migration.sh
chmod +x scripts/migrate_util_info_docs.py

# Install packages with user flag
pip3 install --user motor python-dotenv pydantic
```

### **Import Errors**

```bash
# Add workspace to Python path
export PYTHONPATH="/workspace:$PYTHONPATH"

# Run from workspace root
cd /workspace
python3 scripts/migrate_util_info_docs.py
```

---

## **📊 Migration Data Summary**

The migration includes these documents:

1. **Alternative la FSP (telc, FaMed, PKT)** - Exam alternatives info
2. **Analiza Comparativă a Landurilor** - State comparison analysis  
3. **Canale YouTube utile** - Useful YouTube channels
4. **Grupuri de suport** - Support groups on Facebook
5. **Site-uri oficiale** - Official government websites
6. **Documente specifice per Land** - State-specific documents

Each document includes:
- Title and description
- Content category  
- Rich HTML content
- Display styling (emoji, colors)
- Priority ordering
- Metadata (creation date, author)

---

## **✅ Success Indicators**

Migration is successful when:

1. MongoDB shows 6 documents in `util_info_documents` collection
2. Admin panel displays document management interface
3. Frontend loads dynamic content from `/api/documents/util-info`
4. You can add/edit/delete documents through admin interface

---

## **🎉 Ready to Use!**

Once migration is complete, your "Informatii Utile" section will be fully dynamic and manageable through the admin panel. No more code changes needed to add or update documents!