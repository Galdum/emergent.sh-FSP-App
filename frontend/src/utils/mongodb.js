import { MongoClient } from 'mongodb';

// ⚠️ WARNING: This is for educational purposes only!
// In production, database connections should be handled by the backend server
// Never expose database credentials in frontend code

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    // Use environment variables to store connection string
    this.connectionString = process.env.REACT_APP_MONGODB_URI || '';
  }

  async connect() {
    try {
      if (!this.connectionString) {
        throw new Error('MongoDB connection string not found in environment variables');
      }

      this.client = new MongoClient(this.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      await this.client.connect();
      console.log('Connected to MongoDB');
      
      // Extract database name from connection string
      const dbName = new URL(this.connectionString).pathname.substring(1) || 'fspnavigator';
      this.db = this.client.db(dbName);
      
      return this.db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database connection not established. Call connect() first.');
    }
    return this.db;
  }

  // Example CRUD operations
  async insertDocument(collectionName, document) {
    try {
      const collection = this.db.collection(collectionName);
      const result = await collection.insertOne(document);
      return result;
    } catch (error) {
      console.error('Error inserting document:', error);
      throw error;
    }
  }

  async findDocuments(collectionName, query = {}) {
    try {
      const collection = this.db.collection(collectionName);
      const documents = await collection.find(query).toArray();
      return documents;
    } catch (error) {
      console.error('Error finding documents:', error);
      throw error;
    }
  }

  async updateDocument(collectionName, filter, update) {
    try {
      const collection = this.db.collection(collectionName);
      const result = await collection.updateOne(filter, { $set: update });
      return result;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(collectionName, filter) {
    try {
      const collection = this.db.collection(collectionName);
      const result = await collection.deleteOne(filter);
      return result;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}

// Export singleton instance
const mongoService = new MongoDBService();
export default mongoService;