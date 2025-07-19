import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MessageSquare, Clock, User, Pin } from 'lucide-react';
import AttachmentPreview from './AttachmentPreview';

const ThreadCard = ({ thread, onNavigate, onVote }) => {
  const [isVoting, setIsVoting] = useState(false);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours}h`;
    return `${days}z`;
  };

  const handleVote = async (value) => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      await onVote(thread.id, value);
    } finally {
      setIsVoting(false);
    }
  };

  const getVoteScore = () => thread.up_votes - thread.down_votes;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Voting Section */}
        <div className="flex flex-col items-center justify-start p-4 bg-gray-50 rounded-l-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVote(thread.user_vote === 1 ? 0 : 1);
            }}
            disabled={isVoting}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              thread.user_vote === 1 ? 'text-orange-600 bg-orange-100' : 'text-gray-400'
            } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronUp size={20} />
          </button>
          
          <span className={`font-semibold text-sm py-1 ${
            getVoteScore() > 0 ? 'text-orange-600' : 
            getVoteScore() < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {getVoteScore()}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVote(thread.user_vote === -1 ? 0 : -1);
            }}
            disabled={isVoting}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              thread.user_vote === -1 ? 'text-red-600 bg-red-100' : 'text-gray-400'
            } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Content Section */}
        <div 
          className="flex-1 p-4 cursor-pointer"
          onClick={() => onNavigate(`/thread/${thread.id}`)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {thread.is_pinned && (
                <Pin size={16} className="text-green-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                {thread.title}
              </h3>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock size={12} />
              <span>{formatTimeAgo(thread.created_at)}</span>
            </div>
          </div>

          <div className="text-gray-700 mb-3 line-clamp-3">
            {thread.body}
          </div>

          {/* Attachments */}
          {thread.attachments && thread.attachments.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {thread.attachments.slice(0, 3).map((attachment, index) => (
                  <AttachmentPreview 
                    key={index} 
                    attachment={attachment} 
                    size="small"
                  />
                ))}
                {thread.attachments.length > 3 && (
                  <div className="flex items-center justify-center bg-gray-100 rounded px-3 py-2 text-sm text-gray-600">
                    +{thread.attachments.length - 3} mai multe
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thread Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <User size={14} />
                <span>u/{thread.author_name || thread.author_id}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <MessageSquare size={14} />
                <span>{thread.comment_count || 0} comentarii</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadCard;