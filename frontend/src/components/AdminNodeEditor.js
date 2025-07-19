import React, { useState } from 'react';
import { Edit, Settings, Save, X } from 'lucide-react';
import SimpleContentEditor from './SimpleContentEditor';
import { useAuth } from '../contexts/AuthContext';

const AdminNodeEditor = ({ nodeId, nodeType, nodeName, onContentUpdate }) => {
  const { user } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Only show for admin users
  if (!user?.is_admin && user?.role !== 'admin') {
    return null;
  }

  const handleOpenEditor = (e) => {
    e.stopPropagation(); // Prevent triggering node click
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  const handleSaveContent = () => {
    // Trigger content reload/update in parent component
    if (onContentUpdate) {
      onContentUpdate(nodeId);
    }
    setIsEditorOpen(false);
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

      {/* Content Editor Modal */}
      {isEditorOpen && (
        <SimpleContentEditor
          nodeId={nodeId}
          nodeType={nodeType}
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          onSave={handleSaveContent}
        />
      )}
    </>
  );
};

export default AdminNodeEditor;