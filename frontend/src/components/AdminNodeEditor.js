import React, { useState } from 'react';
import { Edit, Settings, Save, X } from 'lucide-react';
import ContentEditor from './ContentEditor';
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
        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transition-all duration-200 hover:scale-110 z-10"
        title={`Edit ${nodeName} content`}
        style={{ fontSize: '12px' }}
      >
        <Edit size={14} />
      </button>

      {/* Content Editor Modal */}
      {isEditorOpen && (
        <ContentEditor
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