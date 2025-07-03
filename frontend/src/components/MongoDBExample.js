import React, { useState, useEffect } from 'react';
import mongoService from '../utils/mongodb';

// ⚠️ WARNING: This is for educational purposes only!
// In production, use backend APIs instead of direct database connections

const MongoDBExample = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newDocument, setNewDocument] = useState({ name: '', description: '' });

  // Connect to MongoDB when component mounts
  useEffect(() => {
    const connectToMongoDB = async () => {
      try {
        setLoading(true);
        await mongoService.connect();
        setIsConnected(true);
        await loadDocuments();
      } catch (err) {
        setError(`Failed to connect: ${err.message}`);
        console.error('MongoDB connection error:', err);
      } finally {
        setLoading(false);
      }
    };

    connectToMongoDB();

    // Cleanup on unmount
    return () => {
      mongoService.disconnect();
    };
  }, []);

  // Load documents from the database
  const loadDocuments = async () => {
    try {
      const docs = await mongoService.findDocuments('test_collection');
      setDocuments(docs);
    } catch (err) {
      setError(`Failed to load documents: ${err.message}`);
    }
  };

  // Add a new document
  const addDocument = async () => {
    if (!newDocument.name.trim()) return;

    try {
      setLoading(true);
      const result = await mongoService.insertDocument('test_collection', {
        ...newDocument,
        createdAt: new Date()
      });
      
      console.log('Document inserted:', result);
      setNewDocument({ name: '', description: '' });
      await loadDocuments(); // Refresh the list
    } catch (err) {
      setError(`Failed to add document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete a document
  const deleteDocument = async (id) => {
    try {
      setLoading(true);
      await mongoService.deleteDocument('test_collection', { _id: id });
      await loadDocuments(); // Refresh the list
    } catch (err) {
      setError(`Failed to delete document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isConnected) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Connecting to MongoDB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
          ⚠️ Educational Example Only
        </h2>
        <p className="text-yellow-700 text-sm">
          This demonstrates MongoDB usage in React, but in production, you should use backend APIs 
          instead of direct database connections for security reasons.
        </p>
      </div>

      <h1 className="text-2xl font-bold mb-6">MongoDB React Example</h1>

      {/* Connection Status */}
      <div className={`mb-6 p-4 rounded-lg ${isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <p className={`font-medium ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
          {isConnected ? '✅ Connected to MongoDB' : '❌ Not connected to MongoDB'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Document Form */}
      {isConnected && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Add New Document</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Name"
              value={newDocument.name}
              onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Description"
              value={newDocument.description}
              onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <button
              onClick={addDocument}
              disabled={loading || !newDocument.name.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              {loading ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {isConnected && (
        <div>
          <h3 className="text-lg font-medium mb-4">Documents ({documents.length})</h3>
          {documents.length === 0 ? (
            <p className="text-gray-500 italic">No documents found. Add one above to get started.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc._id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{doc.name}</h4>
                      {doc.description && (
                        <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(doc.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDocument(doc._id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MongoDBExample;