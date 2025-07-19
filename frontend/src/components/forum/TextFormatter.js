/**
 * Enhanced text formatting utility for forum posts
 * Supports links, emojis, tables, and other rich formatting
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';

// Enhanced text formatter
export const FormatText = ({ text, className = "" }) => {
  if (!text) return null;

  const formatContent = (content) => {
    let formatted = content;

    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formatted = formatted.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1">${url} <span class="external-link-icon">↗</span></a>`;
    });

    // Convert email addresses to clickable links
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    formatted = formatted.replace(emailRegex, '<a href="mailto:$1" class="text-blue-600 hover:text-blue-800 underline">$1</a>');

    // Convert **bold** text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // Convert *italic* text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Convert `code` text
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  };

  return (
    <div 
      className={`formatted-text ${className}`}
      dangerouslySetInnerHTML={{ __html: formatContent(text) }}
    />
  );
};

// Table formatter component
export const FormatTable = ({ tableText }) => {
  const lines = tableText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return <div className="text-gray-600 text-sm">Invalid table format</div>;
  
  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
  const rows = lines.slice(1).map(line => 
    line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
  );

  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-700 border-b">
                  <FormatText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Link attachment component (simplified)
export const LinkAttachment = ({ url, title, onRemove }) => {
  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
      <div className="flex items-center space-x-2">
        <ExternalLink size={16} className="text-blue-600" />
        <div>
          <div className="text-sm font-medium text-gray-900">
            {title || 'Link'}
          </div>
          <div className="text-xs text-blue-600 truncate max-w-xs">
            {url}
          </div>
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// Enhanced textarea with formatting toolbar
export const EnhancedTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  showToolbar = true,
  ...props 
}) => {
  const insertText = (beforeText, afterText = '') => {
    const textarea = document.activeElement;
    
    // Check if textarea exists and has the required methods
    if (!textarea || !textarea.setSelectionRange || typeof textarea.selectionStart !== 'number') {
      console.warn('Cannot insert text: invalid textarea element');
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + beforeText + selectedText + afterText + value.substring(end);
    onChange({ target: { value: newText } });
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (textarea && textarea.setSelectionRange && textarea.focus) {
        textarea.focus();
        textarea.setSelectionRange(start + beforeText.length + selectedText.length + afterText.length, start + beforeText.length + selectedText.length + afterText.length);
      }
    }, 0);
  };

  return (
    <div className="w-full">
      {showToolbar && (
        <div className="flex items-center space-x-2 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
          <button
            type="button"
            onClick={() => insertText('**', '**')}
            className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*')}
            className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 italic"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => insertText('`', '`')}
            className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 font-mono"
            title="Code"
          >
            {'<>'}
          </button>
          <button
            type="button"
            onClick={() => insertText('\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n')}
            className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100"
            title="Table"
          >
            📋
          </button>
          <div className="text-xs text-gray-500 ml-4">
            **bold**, *italic*, `code`, links auto-detected
          </div>
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${showToolbar ? 'rounded-t-none' : 'rounded-t-lg'} border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 ${className}`}
        {...props}
      />
    </div>
  );
};

// Link input component
export const LinkInput = ({ onAddLink, placeholder = "Adaugă un link..." }) => {
  const [url, setUrl] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    onAddLink({
      type: 'link',
      url: url.trim(),
      file_name: title.trim() || url.trim()
    });
    
    setUrl('');
    setTitle('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
      >
        <ExternalLink size={16} />
        <span>Adaugă link</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 space-y-2">
      <div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titlu link (opțional)"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
        >
          Adaugă
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setUrl('');
            setTitle('');
          }}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          Anulează
        </button>
      </div>
    </form>
  );
};

// Emoji picker (simple implementation)
export const EmojiPicker = ({ onEmojiSelect }) => {
  const emojis = [
    '😀', '😊', '😍', '🤔', '😢', '😠', '👍', '👎', '❤️', '🎉',
    '🚀', '💡', '⚠️', '✅', '❌', '🔥', '💪', '🎯', '📚', '🏥',
    '🇩🇪', '🇷🇴', '💊', '🩺', '📋', '✍️', '💬', '🤝', '🎓', '🏆'
  ];

  return (
    <div className="grid grid-cols-10 gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs">
      {emojis.map((emoji, index) => (
        <button
          key={index}
          onClick={() => onEmojiSelect(emoji)}
          className="w-8 h-8 text-xl hover:bg-gray-100 rounded flex items-center justify-center"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};