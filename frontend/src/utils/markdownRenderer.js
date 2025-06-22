import React from 'react';

/**
 * Enhanced Markdown Renderer for AI responses
 * Handles bold, italic, underline, lists, emojis, and code blocks
 */
export const renderMarkdown = (text) => {
  if (!text) return '';
  
  // Convert text to React elements with proper formatting
  const processText = (text) => {
    let processedText = text;
    const elements = [];
    let currentIndex = 0;
    
    // Define markdown patterns
    const patterns = [
      // Bold text: **text** or __text__
      { 
        regex: /(\*\*|__)(.*?)\1/g, 
        replacement: (match, marker, content) => <strong key={`bold-${currentIndex++}`}>{content}</strong>
      },
      // Italic text: *text* or _text_
      { 
        regex: /(?<!\*)\*(?!\*)(.*?)\*(?!\*)|(?<!_)_(?!_)(.*?)_(?!_)/g, 
        replacement: (match, content1, content2) => <em key={`italic-${currentIndex++}`}>{content1 || content2}</em>
      },
      // Underline text: ~~text~~ (using strikethrough syntax for underline)
      { 
        regex: /~~(.*?)~~/g, 
        replacement: (match, content) => <u key={`underline-${currentIndex++}`}>{content}</u>
      },
      // Inline code: `code`
      { 
        regex: /`([^`]+)`/g, 
        replacement: (match, content) => <code key={`code-${currentIndex++}`} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{content}</code>
      }
    ];
    
    // Process each pattern
    patterns.forEach(pattern => {
      processedText = processedText.replace(pattern.regex, pattern.replacement);
    });
    
    return processedText;
  };
  
  // Split text into lines for list processing
  const lines = text.split('\n');
  const processedLines = [];
  let currentList = null;
  let currentListType = null;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Check for numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+\.)\s+(.+)$/);
    if (numberedMatch) {
      if (currentListType !== 'ol') {
        if (currentList) {
          processedLines.push(currentList);
        }
        currentList = [];
        currentListType = 'ol';
      }
      currentList.push(
        <li key={`ol-${index}`} className="mb-1">
          {processMarkdownInline(numberedMatch[2])}
        </li>
      );
      return;
    }
    
    // Check for bullet lists
    const bulletMatch = trimmedLine.match(/^[•\-\*]\s+(.+)$/);
    if (bulletMatch) {
      if (currentListType !== 'ul') {
        if (currentList) {
          processedLines.push(currentList);
        }
        currentList = [];
        currentListType = 'ul';
      }
      currentList.push(
        <li key={`ul-${index}`} className="mb-1">
          {processMarkdownInline(bulletMatch[1])}
        </li>
      );
      return;
    }
    
    // If we have an active list and this line doesn't continue it, close the list
    if (currentList && currentListType) {
      if (currentListType === 'ol') {
        processedLines.push(
          <ol key={`list-${processedLines.length}`} className="list-decimal list-inside mb-4 space-y-1 ml-4">
            {currentList}
          </ol>
        );
      } else {
        processedLines.push(
          <ul key={`list-${processedLines.length}`} className="list-disc list-inside mb-4 space-y-1 ml-4">
            {currentList}
          </ul>
        );
      }
      currentList = null;
      currentListType = null;
    }
    
    // Handle empty lines
    if (trimmedLine === '') {
      processedLines.push(<br key={`br-${index}`} />);
      return;
    }
    
    // Handle headers
    if (trimmedLine.startsWith('###')) {
      processedLines.push(
        <h3 key={`h3-${index}`} className="text-lg font-semibold mb-2 mt-4">
          {processMarkdownInline(trimmedLine.substring(3).trim())}
        </h3>
      );
      return;
    }
    
    if (trimmedLine.startsWith('##')) {
      processedLines.push(
        <h2 key={`h2-${index}`} className="text-xl font-bold mb-3 mt-4">
          {processMarkdownInline(trimmedLine.substring(2).trim())}
        </h2>
      );
      return;
    }
    
    if (trimmedLine.startsWith('#')) {
      processedLines.push(
        <h1 key={`h1-${index}`} className="text-2xl font-bold mb-4 mt-4">
          {processMarkdownInline(trimmedLine.substring(1).trim())}
        </h1>
      );
      return;
    }
    
    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      // Code block handling would go here
      processedLines.push(
        <pre key={`code-${index}`} className="bg-gray-100 p-3 rounded-lg mb-4 overflow-x-auto">
          <code>{trimmedLine}</code>
        </pre>
      );
      return;
    }
    
    // Regular paragraph
    if (trimmedLine) {
      processedLines.push(
        <p key={`p-${index}`} className="mb-3 leading-relaxed">
          {processMarkdownInline(trimmedLine)}
        </p>
      );
    }
  });
  
  // Close any remaining list
  if (currentList && currentListType) {
    if (currentListType === 'ol') {
      processedLines.push(
        <ol key={`list-${processedLines.length}`} className="list-decimal list-inside mb-4 space-y-1 ml-4">
          {currentList}
        </ol>
      );
    } else {
      processedLines.push(
        <ul key={`list-${processedLines.length}`} className="list-disc list-inside mb-4 space-y-1 ml-4">
          {currentList}
        </ul>
      );
    }
  }
  
  return <div className="markdown-content">{processedLines}</div>;
};

/**
 * Process inline markdown elements (bold, italic, code, etc.)
 */
const processMarkdownInline = (text) => {
  if (!text) return '';
  
  const parts = [];
  let currentIndex = 0;
  let lastIndex = 0;
  
  // Bold pattern: **text**
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add bold text
    parts.push(
      <strong key={`bold-${currentIndex++}`} className="font-bold">
        {match[1]}
      </strong>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  // Process italic in the parts
  const processedParts = [];
  parts.forEach((part, index) => {
    if (typeof part === 'string') {
      const italicRegex = /\*(.*?)\*/g;
      let italicMatch;
      let lastItalicIndex = 0;
      const italicParts = [];
      
      while ((italicMatch = italicRegex.exec(part)) !== null) {
        if (italicMatch.index > lastItalicIndex) {
          italicParts.push(part.slice(lastItalicIndex, italicMatch.index));
        }
        
        italicParts.push(
          <em key={`italic-${index}-${currentIndex++}`} className="italic">
            {italicMatch[1]}
          </em>
        );
        
        lastItalicIndex = italicMatch.index + italicMatch[0].length;
      }
      
      if (lastItalicIndex < part.length) {
        italicParts.push(part.slice(lastItalicIndex));
      }
      
      processedParts.push(...italicParts);
    } else {
      processedParts.push(part);
    }
  });
  
  return processedParts.length > 1 ? <span>{processedParts}</span> : processedParts[0] || text;
};

/**
 * Preserve emoji characters in text
 */
export const preserveEmojis = (text) => {
  // Emoji regex pattern
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  
  return text.replace(emojiRegex, (match) => {
    return `<span class="emoji">${match}</span>`;
  });
};

export default renderMarkdown;