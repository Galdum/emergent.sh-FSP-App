import React, { useState, useEffect } from 'react';
import mongodbApi from '../services/mongodbApi';

const MongoDBDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newDocument, setNewDocument] = useState({ name: '', description: '' });
  const [editingDocument, setEditingDocument] = useState(null);

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [documentsData, statsData] = await Promise.all([
        mongodbApi.getDocuments(),
        mongodbApi.getStats()
      ]);
      setDocuments(documentsData);
      setStats(statsData);
    } catch (err) {
      setError(`Failed to load data: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocument.name.trim()) return;

    setLoading(true);
    try {
      await mongodbApi.createDocument(newDocument);
      setNewDocument({ name: '', description: '' });
      await loadData(); // Refresh data
    } catch (err) {
      setError(`Failed to create document: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    if (!editingDocument) return;

    setLoading(true);
    try {
      await mongodbApi.updateDocument(editingDocument.id, {
        name: editingDocument.name,
        description: editingDocument.description
      });
      setEditingDocument(null);
      await loadData(); // Refresh data
    } catch (err) {
      setError(`Failed to update document: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    setLoading(true);
    try {
      await mongodbApi.deleteDocument(documentId);
      await loadData(); // Refresh data
    } catch (err) {
      setError(`Failed to delete document: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (document) => {
    setEditingDocument({
      id: document.id,
      name: document.name,
      description: document.description || ''
    });
  };

  if (loading && !documents.length) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Loading MongoDB data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MongoDB Dashboard</h1>
        <p className="text-gray-600">Manage documents using secure backend APIs</p>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Collection Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total_documents}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600">Collection</p>
              <p className="text-lg font-semibold">{stats.collection_name}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <button
                onClick={loadData}
                disabled={loading}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Document Form */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Create New Document</h3>
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Document name"
              value={newDocument.name}
              onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDocument.description}
              onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newDocument.name.trim()}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 font-medium"
          >
            {loading ? 'Creating...' : 'Create Document'}
          </button>
        </form>
      </div>

      {/* Edit Document Modal */}
      {editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Edit Document</h3>
            <form onSubmit={handleUpdateDocument} className="space-y-4">
              <input
                type="text"
                placeholder="Document name"
                value={editingDocument.name}
                onChange={(e) => setEditingDocument({...editingDocument, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={editingDocument.description}
                onChange={(e) => setEditingDocument({...editingDocument, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDocument(null)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Documents ({documents.length})</h3>
        </div>
        
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No documents found</p>
            <p className="text-sm">Create your first document using the form above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    {doc.description && (
                      <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-400 space-y-1">
                      <p>Created: {new Date(doc.created_at).toLocaleString()}</p>
                      {doc.updated_at && (
                        <p>Updated: {new Date(doc.updated_at).toLocaleString()}</p>
                      )}
                      <p>ID: {doc.id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => startEditing(doc)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MongoDBDashboard;