import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Eye, X, Plus, Trash2, Upload, Image, FileText, 
  Link, List, Table, Minus, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Palette, Type,
  Monitor, Smartphone, History, RotateCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const ContentEditor = ({ nodeId, nodeType, isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [originalContent, setOriginalContent] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeBlock, setActiveBlock] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Content block types
  const blockTypes = [
    { type: 'text', label: 'Text', icon: Type, description: 'Rich text content' },
    { type: 'image', label: 'Image', icon: Image, description: 'Upload or embed images' },
    { type: 'file', label: 'File', icon: FileText, description: 'Attach documents (PDF, Word, etc.)' },
    { type: 'link', label: 'Link', icon: Link, description: 'Add clickable links' },
    { type: 'list', label: 'List', icon: List, description: 'Bulleted or numbered lists' },
    { type: 'table', label: 'Table', icon: Table, description: 'Data tables' },
    { type: 'divider', label: 'Divider', icon: Minus, description: 'Section separator' }
  ];

  // Load content when editor opens
  useEffect(() => {
    if (isOpen && nodeId) {
      loadContent();
    }
  }, [isOpen, nodeId]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/content/nodes/${nodeId}`);
      setContent(response);
      setOriginalContent(JSON.parse(JSON.stringify(response))); // Deep copy
      setIsPreviewMode(false);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersionHistory = async () => {
    try {
      const response = await api.get(`/content/nodes/${nodeId}/versions`);
      setVersions(response.versions || []);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const addBlock = (type, position = -1) => {
    if (!content) return;

    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      content: getDefaultContent(type),
      position: position === -1 ? content.blocks.length : position,
      styles: {},
      metadata: {}
    };

    const newBlocks = [...content.blocks];
    if (position === -1) {
      newBlocks.push(newBlock);
    } else {
      newBlocks.splice(position, 0, newBlock);
      // Update positions of following blocks
      newBlocks.forEach((block, index) => {
        block.position = index;
      });
    }

    setContent({
      ...content,
      blocks: newBlocks
    });
    setActiveBlock(newBlock.id);
  };

  const getDefaultContent = (type) => {
    switch (type) {
      case 'text':
        return { 
          html: '<p>Enter your text here...</p>',
          plainText: 'Enter your text here...'
        };
      case 'image':
        return { 
          url: '', 
          alt: '', 
          width: 'auto', 
          height: 'auto',
          alignment: 'center'
        };
      case 'file':
        return { 
          url: '', 
          filename: '', 
          fileType: '',
          size: 0
        };
      case 'link':
        return { 
          url: '', 
          text: 'Click here',
          target: '_blank'
        };
      case 'list':
        return { 
          type: 'bulleted',
          items: ['Item 1', 'Item 2']
        };
      case 'table':
        return {
          headers: ['Column 1', 'Column 2'],
          rows: [
            ['Cell 1', 'Cell 2'],
            ['Cell 3', 'Cell 4']
          ]
        };
      case 'divider':
        return { 
          style: 'line',
          thickness: 1,
          color: '#e5e7eb'
        };
      default:
        return {};
    }
  };

  const updateBlock = (blockId, updates) => {
    if (!content) return;

    const newBlocks = content.blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return block;
    });

    setContent({
      ...content,
      blocks: newBlocks
    });
  };

  const deleteBlock = (blockId) => {
    if (!content) return;

    const newBlocks = content.blocks
      .filter(block => block.id !== blockId)
      .map((block, index) => ({
        ...block,
        position: index
      }));

    setContent({
      ...content,
      blocks: newBlocks
    });

    if (activeBlock === blockId) {
      setActiveBlock(null);
    }
  };

  const moveBlock = (blockId, direction) => {
    if (!content) return;

    const blocks = [...content.blocks];
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= blocks.length) return;

    // Swap blocks
    [blocks[currentIndex], blocks[newIndex]] = [blocks[newIndex], blocks[currentIndex]];
    
    // Update positions
    blocks.forEach((block, index) => {
      block.position = index;
    });

    setContent({
      ...content,
      blocks
    });
  };

  const handleFileUpload = async (file, blockId = null) => {
    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content_type', file.type.startsWith('image/') ? 'image' : 'document');

      const response = await api.post('/content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (blockId) {
        // Update existing block
        const fileData = {
          url: `/content/files/${response.file_id}`,
          filename: response.original_name,
          fileType: response.file_type,
          size: response.file_size
        };

        if (response.file_type === 'image') {
          updateBlock(blockId, {
            content: {
              ...fileData,
              alt: response.original_name,
              width: 'auto',
              height: 'auto',
              alignment: 'center'
            }
          });
        } else {
          updateBlock(blockId, { content: fileData });
        }
      } else {
        // Create new block
        const blockType = response.file_type === 'image' ? 'image' : 'file';
        addBlock(blockType);
        
        // The block will be added and then we'll update it in the next render
        setTimeout(() => {
          const newBlock = content.blocks[content.blocks.length - 1];
          if (newBlock) {
            const fileData = {
              url: `/content/files/${response.file_id}`,
              filename: response.original_name,
              fileType: response.file_type,
              size: response.file_size
            };

            if (response.file_type === 'image') {
              updateBlock(newBlock.id, {
                content: {
                  ...fileData,
                  alt: response.original_name,
                  width: 'auto',
                  height: 'auto',
                  alignment: 'center'
                }
              });
            } else {
              updateBlock(newBlock.id, { content: fileData });
            }
          }
        }, 100);
      }

      return response;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setUploadingFile(false);
    }
  };

  const createPreview = async () => {
    if (!content || !originalContent) return;

    setLoading(true);
    try {
      // Calculate changes
      const changes = {
        title: content.title !== originalContent.title ? content.title : undefined,
        description: content.description !== originalContent.description ? content.description : undefined,
        blocks: JSON.stringify(content.blocks) !== JSON.stringify(originalContent.blocks) ? 
          content.blocks.map(block => ({
            type: block.type,
            content: block.content,
            position: block.position,
            styles: block.styles,
            metadata: block.metadata
          })) : undefined,
        layout: JSON.stringify(content.layout) !== JSON.stringify(originalContent.layout) ? content.layout : undefined
      };

      // Remove undefined values
      const validChanges = Object.fromEntries(
        Object.entries(changes).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(validChanges).length === 0) {
        alert('No changes to preview');
        return;
      }

      const response = await api.post(`/content/nodes/${nodeId}/preview`, {
        content_id: content.id,
        changes: validChanges,
        preview_duration_hours: 24
      });

      setPreviewContent(response.preview_content);
      setIsPreviewMode(true);
    } catch (error) {
      console.error('Error creating preview:', error);
      alert('Error creating preview: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const publishChanges = async () => {
    if (!previewContent) return;

    setSaving(true);
    try {
      await api.post(`/content/previews/${previewContent.id}/publish`, {
        preview_id: previewContent.id,
        change_description: `Updated ${content?.title || 'content'} via admin editor`
      });

      alert('Changes published successfully!');
      setIsPreviewMode(false);
      setPreviewContent(null);
      onSave && onSave();
      onClose();
    } catch (error) {
      console.error('Error publishing changes:', error);
      alert('Error publishing changes: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    if (originalContent) {
      setContent(JSON.parse(JSON.stringify(originalContent)));
      setIsPreviewMode(false);
      setPreviewContent(null);
      setActiveBlock(null);
    }
  };

  const revertToVersion = async (versionNumber) => {
    if (!window.confirm(`Are you sure you want to revert to version ${versionNumber}? This will create a new version.`)) {
      return;
    }

    try {
      await api.post(`/content/nodes/${nodeId}/revert/${versionNumber}`);
      alert('Content reverted successfully!');
      await loadContent();
      setShowVersionHistory(false);
    } catch (error) {
      console.error('Error reverting content:', error);
      alert('Error reverting content: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">
                  Content Editor - {content?.title || `Node ${nodeId}`}
                </h2>
                <p className="text-blue-100 text-sm">
                  {nodeType} • Version {content?.version || 1}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Mode Toggle */}
              <div className="flex bg-white bg-opacity-20 rounded-lg p-1">
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    !isPreviewMode ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setIsPreviewMode(true)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    isPreviewMode ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                  disabled={!previewContent}
                >
                  Preview
                </button>
              </div>
              
              {/* Action Buttons */}
              <button
                onClick={() => setShowVersionHistory(true)}
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                title="Version History"
              >
                <History className="h-4 w-4" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex h-[calc(95vh-140px)]">
          {/* Sidebar - Block Types & Tools */}
          {!isPreviewMode && (
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Add Content Blocks</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {blockTypes.map((blockType) => {
                      const Icon = blockType.icon;
                      return (
                        <button
                          key={blockType.type}
                          onClick={() => addBlock(blockType.type)}
                          className="flex items-center gap-2 p-2 bg-white rounded border hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                          title={blockType.description}
                        >
                          <Icon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">{blockType.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Upload</h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingFile ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4 mx-auto"></div>
                  <p className="text-gray-600">Loading content...</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Content Header */}
                <div className="mb-6">
                  {!isPreviewMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Node Title
                        </label>
                        <input
                          type="text"
                          value={content?.title || ''}
                          onChange={(e) => setContent({
                            ...content,
                            title: e.target.value,
                            updated_at: new Date().toISOString()
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                          placeholder="Enter node title..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          value={content?.description || ''}
                          onChange={(e) => setContent({
                            ...content,
                            description: e.target.value,
                            updated_at: new Date().toISOString()
                          })}
                          rows={2}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter node description..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {previewContent?.title || content?.title}
                      </h1>
                      {(previewContent?.description || content?.description) && (
                        <p className="text-gray-600">
                          {previewContent?.description || content?.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Content Blocks */}
                <div className="space-y-4">
                  {(isPreviewMode ? previewContent?.blocks : content?.blocks || [])
                    .sort((a, b) => a.position - b.position)
                    .map((block, index) => (
                      <ContentBlock
                        key={block.id}
                        block={block}
                        isPreview={isPreviewMode}
                        isActive={activeBlock === block.id}
                        onActivate={() => setActiveBlock(block.id)}
                        onUpdate={(updates) => updateBlock(block.id, updates)}
                        onDelete={() => deleteBlock(block.id)}
                        onMove={(direction) => moveBlock(block.id, direction)}
                        onFileUpload={(file) => handleFileUpload(file, block.id)}
                        canMoveUp={index > 0}
                        canMoveDown={index < (content?.blocks?.length || 1) - 1}
                      />
                    ))}
                  
                  {(!content?.blocks || content.blocks.length === 0) && !isPreviewMode && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No content blocks yet</p>
                      <button
                        onClick={() => addBlock('text')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Your First Block
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Last updated: {content?.updated_at ? new Date(content.updated_at).toLocaleString() : 'Never'}</span>
              {content?.updated_by && <span>• by {content.updated_by}</span>}
            </div>
            
            <div className="flex items-center gap-2">
              {!isPreviewMode ? (
                <>
                  <button
                    onClick={discardChanges}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Discard Changes
                  </button>
                  
                  <button
                    onClick={createPreview}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {loading ? 'Creating Preview...' : 'Preview Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsPreviewMode(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue Editing
                  </button>
                  
                  <button
                    onClick={publishChanges}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Publishing...' : 'Publish Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Version History Modal */}
        {showVersionHistory && (
          <VersionHistoryModal
            versions={versions}
            onClose={() => setShowVersionHistory(false)}
            onRevert={revertToVersion}
            onLoad={loadVersionHistory}
          />
        )}
      </div>
    </div>
  );
};

// Content Block Component
const ContentBlock = ({ 
  block, 
  isPreview, 
  isActive, 
  onActivate, 
  onUpdate, 
  onDelete, 
  onMove, 
  onFileUpload,
  canMoveUp,
  canMoveDown 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(block.content);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  const handleSaveContent = () => {
    onUpdate({ content: localContent });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setLocalContent(block.content);
    setIsEditing(false);
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        if (isPreview || !isEditing) {
          return (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: localContent.html || localContent.plainText || '' }}
            />
          );
        } else {
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <button className="p-1 border rounded hover:bg-gray-50" title="Bold">
                  <Bold className="h-4 w-4" />
                </button>
                <button className="p-1 border rounded hover:bg-gray-50" title="Italic">
                  <Italic className="h-4 w-4" />
                </button>
                <button className="p-1 border rounded hover:bg-gray-50" title="Underline">
                  <Underline className="h-4 w-4" />
                </button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button className="p-1 border rounded hover:bg-gray-50" title="Align Left">
                  <AlignLeft className="h-4 w-4" />
                </button>
                <button className="p-1 border rounded hover:bg-gray-50" title="Align Center">
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button className="p-1 border rounded hover:bg-gray-50" title="Align Right">
                  <AlignRight className="h-4 w-4" />
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={typeof localContent === 'string' ? localContent : localContent.plainText || ''}
                onChange={(e) => setLocalContent({
                  ...localContent,
                  plainText: e.target.value,
                  html: `<p>${e.target.value.replace(/\n/g, '</p><p>')}</p>`
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-32"
                placeholder="Enter your text content..."
              />
            </div>
          );
        }

      case 'image':
        return (
          <div className="space-y-2">
            {localContent.url ? (
              <div className={`flex justify-${localContent.alignment || 'center'}`}>
                <img
                  src={localContent.url}
                  alt={localContent.alt || ''}
                  style={{
                    width: localContent.width || 'auto',
                    height: localContent.height || 'auto',
                    maxWidth: '100%'
                  }}
                  className="rounded-lg shadow-sm"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No image uploaded</p>
                {!isPreview && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        onFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                )}
              </div>
            )}
            
            {!isPreview && (isEditing || !localContent.url) && (
              <div className="space-y-2 bg-gray-50 p-3 rounded border">
                <input
                  type="text"
                  placeholder="Alt text"
                  value={localContent.alt || ''}
                  onChange={(e) => setLocalContent({ ...localContent, alt: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Width (e.g., 300px, auto)"
                    value={localContent.width || ''}
                    onChange={(e) => setLocalContent({ ...localContent, width: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Height"
                    value={localContent.height || ''}
                    onChange={(e) => setLocalContent({ ...localContent, height: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <select
                  value={localContent.alignment || 'center'}
                  onChange={(e) => setLocalContent({ ...localContent, alignment: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="left">Left Aligned</option>
                  <option value="center">Center Aligned</option>
                  <option value="right">Right Aligned</option>
                </select>
                {!localContent.url && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Choose Image
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            {localContent.url ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                <FileText className="h-8 w-8 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{localContent.filename}</p>
                  <p className="text-sm text-gray-600">
                    {localContent.fileType} • {Math.round(localContent.size / 1024)}KB
                  </p>
                </div>
                <a
                  href={localContent.url}
                  download={localContent.filename}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Download
                </a>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No file attached</p>
                {!isPreview && (
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        onFileUpload(e.target.files[0]);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}
              </div>
            )}
          </div>
        );

      case 'link':
        return (
          <div className="space-y-2">
            {isPreview || !isEditing ? (
              <a
                href={localContent.url}
                target={localContent.target || '_blank'}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
              >
                <Link className="h-4 w-4" />
                {localContent.text || localContent.url}
              </a>
            ) : (
              <div className="space-y-2 bg-gray-50 p-3 rounded border">
                <input
                  type="text"
                  placeholder="Link text"
                  value={localContent.text || ''}
                  onChange={(e) => setLocalContent({ ...localContent, text: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={localContent.url || ''}
                  onChange={(e) => setLocalContent({ ...localContent, url: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <select
                  value={localContent.target || '_blank'}
                  onChange={(e) => setLocalContent({ ...localContent, target: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="_blank">Open in new tab</option>
                  <option value="_self">Open in same tab</option>
                </select>
              </div>
            )}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            {isPreview || !isEditing ? (
              localContent.type === 'bulleted' ? (
                <ul className="list-disc list-inside space-y-1">
                  {localContent.items?.map((item, index) => (
                    <li key={index} className="text-gray-900">{item}</li>
                  ))}
                </ul>
              ) : (
                <ol className="list-decimal list-inside space-y-1">
                  {localContent.items?.map((item, index) => (
                    <li key={index} className="text-gray-900">{item}</li>
                  ))}
                </ol>
              )
            ) : (
              <div className="space-y-2 bg-gray-50 p-3 rounded border">
                <select
                  value={localContent.type || 'bulleted'}
                  onChange={(e) => setLocalContent({ ...localContent, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="bulleted">Bulleted List</option>
                  <option value="numbered">Numbered List</option>
                </select>
                <div className="space-y-1">
                  {localContent.items?.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newItems = [...(localContent.items || [])];
                          newItems[index] = e.target.value;
                          setLocalContent({ ...localContent, items: newItems });
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm"
                        placeholder={`Item ${index + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newItems = localContent.items?.filter((_, i) => i !== index) || [];
                          setLocalContent({ ...localContent, items: newItems });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newItems = [...(localContent.items || []), ''];
                      setLocalContent({ ...localContent, items: newItems });
                    }}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'table':
        return (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {localContent.headers?.map((header, index) => (
                      <th key={index} className="border border-gray-300 p-2 text-left font-medium">
                        {isPreview || !isEditing ? (
                          header
                        ) : (
                          <input
                            type="text"
                            value={header}
                            onChange={(e) => {
                              const newHeaders = [...(localContent.headers || [])];
                              newHeaders[index] = e.target.value;
                              setLocalContent({ ...localContent, headers: newHeaders });
                            }}
                            className="w-full bg-transparent border-0 focus:ring-0 font-medium"
                            placeholder={`Column ${index + 1}`}
                          />
                        )}
                      </th>
                    ))}
                    {!isPreview && isEditing && (
                      <th className="border border-gray-300 p-1">
                        <button
                          onClick={() => {
                            const newHeaders = [...(localContent.headers || []), ''];
                            const newRows = localContent.rows?.map(row => [...row, '']) || [];
                            setLocalContent({ ...localContent, headers: newHeaders, rows: newRows });
                          }}
                          className="text-green-600 hover:bg-green-50 p-1 rounded"
                          title="Add Column"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {localContent.rows?.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 p-2">
                          {isPreview || !isEditing ? (
                            cell
                          ) : (
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => {
                                const newRows = [...(localContent.rows || [])];
                                newRows[rowIndex][cellIndex] = e.target.value;
                                setLocalContent({ ...localContent, rows: newRows });
                              }}
                              className="w-full bg-transparent border-0 focus:ring-0"
                              placeholder={`Cell ${rowIndex + 1}-${cellIndex + 1}`}
                            />
                          )}
                        </td>
                      ))}
                      {!isPreview && isEditing && (
                        <td className="border border-gray-300 p-1">
                          <button
                            onClick={() => {
                              const newRows = localContent.rows?.filter((_, i) => i !== rowIndex) || [];
                              setLocalContent({ ...localContent, rows: newRows });
                            }}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                            title="Delete Row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!isPreview && isEditing && (
                    <tr>
                      <td colSpan={localContent.headers?.length || 1} className="border border-gray-300 p-1">
                        <button
                          onClick={() => {
                            const newRow = Array(localContent.headers?.length || 2).fill('');
                            const newRows = [...(localContent.rows || []), newRow];
                            setLocalContent({ ...localContent, rows: newRows });
                          }}
                          className="w-full p-2 text-green-600 hover:bg-green-50 rounded text-sm"
                        >
                          + Add Row
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-2">
            <hr 
              style={{
                height: localContent.thickness || 1,
                backgroundColor: localContent.color || '#e5e7eb',
                border: 'none',
                borderRadius: localContent.style === 'rounded' ? '999px' : '0'
              }}
              className="w-full"
            />
            {!isPreview && isEditing && (
              <div className="flex gap-2 bg-gray-50 p-2 rounded border">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={localContent.thickness || 1}
                  onChange={(e) => setLocalContent({ ...localContent, thickness: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <input
                  type="color"
                  value={localContent.color || '#e5e7eb'}
                  onChange={(e) => setLocalContent({ ...localContent, color: e.target.value })}
                  className="w-8 h-8 rounded border-0"
                />
                <select
                  value={localContent.style || 'line'}
                  onChange={(e) => setLocalContent({ ...localContent, style: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="line">Line</option>
                  <option value="rounded">Rounded</option>
                </select>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-gray-500 italic">Unknown block type: {block.type}</p>;
    }
  };

  return (
    <div
      className={`relative border rounded-lg p-4 transition-all duration-200 ${
        isActive && !isPreview 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300'
      } ${isPreview ? 'bg-white' : 'bg-white hover:bg-gray-50'}`}
      onClick={() => !isPreview && onActivate()}
    >
      {/* Block Controls */}
      {!isPreview && isActive && (
        <div className="absolute -top-3 right-2 flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-1 shadow-sm">
          <button
            onClick={() => onMove('up')}
            disabled={!canMoveUp}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Move Up"
          >
            ↑
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={!canMoveDown}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Move Down"
          >
            ↓
          </button>
          <div className="w-px h-4 bg-gray-300"></div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 hover:bg-gray-100 rounded text-blue-600"
            title="Edit"
          >
            ✎
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this block?')) {
                onDelete();
              }
            }}
            className="p-1 hover:bg-gray-100 rounded text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Block Type Badge */}
      <div className="absolute -top-2 left-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
        {block.type}
      </div>

      {/* Block Content */}
      <div className="mt-2">
        {renderBlockContent()}
      </div>

      {/* Edit Actions */}
      {!isPreview && isEditing && ['text', 'image', 'file', 'link', 'list', 'table', 'divider'].includes(block.type) && (
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={handleCancelEdit}
            className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveContent}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

// Version History Modal Component
const VersionHistoryModal = ({ versions, onClose, onRevert, onLoad }) => {
  useEffect(() => {
    onLoad();
  }, [onLoad]);

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {versions.length === 0 ? (
            <div className="p-8 text-center">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No version history available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {versions.map((version) => (
                <div key={version.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          Version {version.version_number}
                        </span>
                        {version.change_description && (
                          <span className="text-sm text-gray-600">
                            • {version.change_description}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(version.changed_at).toLocaleString()} by {version.changed_by}
                      </div>
                    </div>
                    <button
                      onClick={() => onRevert(version.version_number)}
                      className="flex items-center gap-1 px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 text-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Revert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;