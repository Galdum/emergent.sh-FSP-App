import React, { useState } from 'react';
import { X, Upload, Link, Image, FileText } from 'lucide-react';
import { api } from '../../services/api';

const CreateThreadModal = ({ forumSlug, onClose, onThreadCreated }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/forums/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setAttachments(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Eroare la încărcarea fișierelor');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;

    const linkAttachment = {
      type: 'link',
      url: linkUrl,
      file_name: linkUrl
    };

    setAttachments(prev => [...prev, linkAttachment]);
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      alert('Titlul și conținutul sunt obligatorii');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post(`/forums/${forumSlug}/threads`, {
        title: title.trim(),
        body: body.trim(),
        attachments: attachments
      });

      onThreadCreated(response.data);
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('Eroare la crearea discuției');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttachmentIcon = (attachment) => {
    switch (attachment.type) {
      case 'image':
        return <Image size={16} className="text-green-600" />;
      case 'link':
        return <Link size={16} className="text-blue-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Creează o discuție nouă
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Titlu *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Introdu un titlu descriptiv..."
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {title.length}/200 caractere
            </div>
          </div>

          {/* Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              Conținut *
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Descrie problema, întrebarea sau subiectul de discuție..."
              rows={8}
              maxLength={5000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {body.length}/5000 caractere
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anexe (opțional)
            </label>
            
            <div className="flex items-center space-x-3 mb-4">
              {/* File Upload */}
              <label className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                <Upload size={16} />
                <span className="text-sm">Încarcă fișier</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={uploadingFiles}
                  className="hidden"
                />
              </label>

              {/* Add Link */}
              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className="flex items-center space-x-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors"
              >
                <Link size={16} />
                <span className="text-sm">Adaugă link</span>
              </button>
            </div>

            {/* Link Input */}
            {showLinkInput && (
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Adaugă
                </button>
              </div>
            )}

            {/* Uploading Indicator */}
            {uploadingFiles && (
              <div className="flex items-center space-x-2 text-orange-600 mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                <span className="text-sm">Se încarcă fișierele...</span>
              </div>
            )}

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      {getAttachmentIcon(attachment)}
                      <span className="text-sm text-gray-700 truncate">
                        {attachment.file_name || attachment.url}
                      </span>
                      {attachment.size && (
                        <span className="text-xs text-gray-500">
                          ({Math.round(attachment.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Anulează
            </button>
            
            <button
              type="submit"
              disabled={!title.trim() || !body.trim() || isSubmitting || uploadingFiles}
              className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Se creează...</span>
                </>
              ) : (
                <span>Creează discuția</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateThreadModal;