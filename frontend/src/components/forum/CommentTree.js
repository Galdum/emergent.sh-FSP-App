import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Reply, Clock, User } from 'lucide-react';

const CommentTree = ({ comments, onVote, onReply, depth = 0, maxDepth = 3 }) => {
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleVote = async (commentId, value) => {
    try {
      await onVote(commentId, value);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onReply(replyText, parentId);
      setReplyText('');
      setReplyToId(null);
    } catch (error) {
      console.error('Error replying:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVoteScore = (comment) => comment.up_votes - comment.down_votes;

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className={`${depth > 0 ? 'ml-8' : ''}`}>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex space-x-3">
              {/* Voting */}
              <div className="flex flex-col items-center space-y-1">
                <button
                  onClick={() => handleVote(comment.id, comment.user_vote === 1 ? 0 : 1)}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                    comment.user_vote === 1 ? 'text-orange-600 bg-orange-100' : 'text-gray-400'
                  }`}
                >
                  <ChevronUp size={16} />
                </button>
                
                <span className={`text-xs font-semibold ${
                  getVoteScore(comment) > 0 ? 'text-orange-600' : 
                  getVoteScore(comment) < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {getVoteScore(comment)}
                </span>
                
                <button
                  onClick={() => handleVote(comment.id, comment.user_vote === -1 ? 0 : -1)}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                    comment.user_vote === -1 ? 'text-red-600 bg-red-100' : 'text-gray-400'
                  }`}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Comment Content */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <User size={12} />
                    <span className="font-medium">u/{comment.author_name || comment.author_id}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{formatTimeAgo(comment.created_at)}</span>
                  </div>
                </div>

                <div className="text-gray-800 mb-3 whitespace-pre-wrap">
                  {comment.body}
                </div>

                {/* Reply Button */}
                {depth < maxDepth && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      <Reply size={14} />
                      <span>Răspunde</span>
                    </button>
                  </div>
                )}

                {/* Reply Form */}
                {replyToId === comment.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Scrie un răspuns..."
                      className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyText.trim() || isSubmitting}
                        className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isSubmitting ? 'Se trimite...' : 'Răspunde'}
                      </button>
                      <button
                        onClick={() => {
                          setReplyToId(null);
                          setReplyText('');
                        }}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              <CommentTree
                comments={comment.replies}
                onVote={onVote}
                onReply={onReply}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentTree;