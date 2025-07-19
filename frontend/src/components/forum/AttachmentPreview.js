import React from 'react';
import { FileText, Image, ExternalLink, Download } from 'lucide-react';

const AttachmentPreview = ({ attachment, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const getIcon = () => {
    switch (attachment.type) {
      case 'image':
        return <Image size={size === 'small' ? 16 : 20} />;
      case 'link':
        return <ExternalLink size={size === 'small' ? 16 : 20} />;
      default:
        return <FileText size={size === 'small' ? 16 : 20} />;
    }
  };

  const handleClick = () => {
    if (attachment.type === 'link') {
      window.open(attachment.url, '_blank');
    } else {
      // For files, either display or download
      window.open(attachment.url, '_blank');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (attachment.type === 'image') {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-gray-200`}
        onClick={handleClick}
      >
        <img
          src={attachment.url}
          alt={attachment.file_name || 'Attachment'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 cursor-pointer transition-colors flex flex-col items-center justify-center p-2`}
      onClick={handleClick}
    >
      <div className="text-gray-600 mb-1">
        {getIcon()}
      </div>
      
      <div className="text-center">
        <div className="text-xs font-medium text-gray-800 truncate w-full">
          {attachment.file_name || 'Link'}
        </div>
        {attachment.size && (
          <div className="text-xs text-gray-500">
            {formatFileSize(attachment.size)}
          </div>
        )}
      </div>
      
      {attachment.type === 'file' && (
        <Download size={12} className="text-gray-400 mt-1" />
      )}
    </div>
  );
};

export default AttachmentPreview;