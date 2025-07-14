import React, { useState, useEffect, useRef } from 'react';
import { X, Users } from 'lucide-react';

/**
 * CommunityChatModal - Simple forum/message board for premium users
 * Future improvement: integrate real backend, real-time updates, threads, file attachments, moderation, etc.
 */
const DUMMY_POSTS = [
  {
    id: 1,
    author: 'Dr. Maria Popescu',
    content: 'Bun venit în chatul comunității! Întrebați orice legat de Approbation sau împărtășiți experiențe.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 2,
    author: 'Dr. Alexandru Ionescu',
    content: 'Ce acte ați depus pentru Bavaria? Aveți un model de CV acceptat?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

export default function CommunityChatModal({ onClose }) {
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  // Simulate fetching posts from API/localStorage
  useEffect(() => {
    setPosts(DUMMY_POSTS);
  }, []);

  // Scroll to bottom on new post
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setSending(true);
    // Simulate API call
    setTimeout(() => {
      setPosts(prev => [
        ...prev,
        {
          id: prev.length + 1,
          author: 'Tu', // In real app, use current user
          content: newMessage.trim(),
          timestamp: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
      setSending(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col animate-fade-in-fast">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7" />
            <span className="text-lg font-bold">Chat Comunitate (Premium)</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={28} />
          </button>
        </div>
        {/* Posts */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto" style={{ minHeight: 300 }}>
          {posts.length === 0 && (
            <div className="text-center text-gray-400">Nicio postare încă. Fii primul care scrie!</div>
          )}
          {posts.map(post => (
            <div key={post.id} className="bg-gray-50 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-orange-700">{post.author}</span>
                <span className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-gray-800 whitespace-pre-line">{post.content}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {/* New message input */}
        <div className="p-4 border-t border-gray-200 bg-white flex gap-2 items-end">
          <textarea
            className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            rows={2}
            maxLength={1000}
            placeholder="Scrie un mesaj... (doar text, pentru moment)"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            disabled={sending}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
          >
            Trimite
          </button>
        </div>
        {/* Footer note */}
        <div className="text-xs text-gray-400 text-center py-2 border-t bg-gray-50 rounded-b-2xl">
          Doar pentru membri Premium. Viitoare îmbunătățiri: chat în timp real, fire pe teme, atașamente, moderare...
        </div>
      </div>
    </div>
  );
}