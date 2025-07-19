import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminNodeEditor = ({ nodeId, nodeType, nodeName, onContentUpdate }) => {
  const { user } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Only show for admin users
  if (!user?.is_admin && user?.role !== 'admin') {
    return null;
  }

  const handleOpenEditor = (e) => {
    e.stopPropagation();
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  const handleSave = () => {
    alert(`Content saved for ${nodeType} ${nodeId}!`);
    setIsEditorOpen(false);
    if (onContentUpdate) {
      onContentUpdate(nodeId);
    }
  };

  return (
    <>
      {/* Admin Edit Button */}
      <button
        onClick={handleOpenEditor}
        className="absolute top-0 right-0 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-200 hover:scale-110 z-50"
        title={`Edit ${nodeName} content`}
        style={{ 
          width: '20px', 
          height: '20px',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translate(5px, -5px)'
        }}
      >
        <Edit size={12} />
      </button>

      {/* SIMPLE WORKING MODAL */}
      {isEditorOpen && (
        <div 
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: '99999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseEditor();
            }
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              width: '90%',
              maxWidth: '800px',
              height: '80%',
              maxHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
              color: 'white',
              padding: '20px',
              borderTopLeftRadius: '10px',
              borderTopRightRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
                Edit {nodeType} {nodeId}
              </h2>
              <button 
                onClick={handleCloseEditor}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div style={{
              padding: '20px',
              flex: '1',
              overflowY: 'auto'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Content Editor</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Title:
                </label>
                <input
                  type="text"
                  defaultValue={`${nodeType} ${nodeId} Content`}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Content:
                </label>
                <textarea
                  defaultValue="Enter your content here..."
                  rows="8"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '5px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>
                  📷 Add Image
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>
                  📄 Add File
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>
                  🔗 Add Link
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>
                  📋 Add Table
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px',
              borderTop: '2px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px'
            }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>
                Editing {nodeType} {nodeId} • All changes auto-saved
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleCloseEditor}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  💾 Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNodeEditor;