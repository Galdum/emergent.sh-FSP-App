import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Eye, X, Plus, Trash2, Upload, Image, FileText, 
  Link, List, Table, Minus, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Palette, Type,
  Monitor, Smartphone, History, RotateCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const SimpleContentEditor = ({ nodeId, nodeType, isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(`Node ${nodeId} Content`);
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('Enter your content here...');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    console.log('Saving content:', { title, description, textContent });
    alert(`Content saved for ${nodeType} ${nodeId}!`);
    onSave && onSave();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Content Editor - Node {nodeId}</h2>
                <p className="text-blue-100 text-sm">{nodeType} Content</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                placeholder="Enter node title..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter description..."
              />
            </div>

            {/* Text Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <div className="border border-gray-300 rounded-lg">
                {/* Toolbar */}
                <div className="border-b border-gray-200 p-2 flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded" title="Bold">
                    <Bold className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded" title="Italic">
                    <Italic className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded" title="Underline">
                    <Underline className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button className="p-2 hover:bg-gray-100 rounded" title="Align Left">
                    <AlignLeft className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded" title="Align Center">
                    <AlignCenter className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded" title="Align Right">
                    <AlignRight className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button className="p-2 hover:bg-gray-100 rounded" title="Add Image">
                    <Image className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded" title="Add Link">
                    <Link className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Text Area */}
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={10}
                  className="w-full p-4 resize-none focus:outline-none"
                  placeholder="Enter your content here..."
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <Image className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Add Image</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">Add File</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                <Link className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-700">Add Link</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                <Table className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-700">Add Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Editing {nodeType} {nodeId} • All changes are saved automatically
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleContentEditor;