import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ChevronUp, ChevronDown, User, Clock, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import CommentTree from './CommentTree';
import AttachmentPreview from './AttachmentPreview';

const ThreadDetailPage = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('best');

  useEffect(() => {
    if (!user || user.subscription_tier !== 'PREMIUM') {
      return;
    }
    
    loadThread();
    loadComments();
  }, [threadId, user]);

  useEffect(() => {
    if (thread && sortBy) {
      loadComments();
    }
  }, [sortBy]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forums/thread/${threadId}`);
      setThread(response.data);
    } catch (err) {
      console.error('Error loading thread:', err);
      setError('Discuția nu a fost găsită');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const response = await api.get(`/forums/thread/${threadId}/comments`, {
        params: { sort: sortBy }
      });
      setComments(response.data);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleThreadVote = async (value) => {
    try {
      await api.post(`/forums/thread/${threadId}/vote`, { value });
      
      // Update local state optimistically
      setThread(prev => {
        const oldVote = prev.user_vote || 0;
        let upChange = 0;
        let downChange = 0;
        
        if (oldVote === 1 && value === 0) upChange = -1;
        else if (oldVote === 1 && value === -1) { upChange = -1; downChange = 1; }
        else if (oldVote === -1 && value === 0) downChange = -1;
        else if (oldVote === -1 && value === 1) { downChange = -1; upChange = 1; }
        else if (oldVote === 0 && value === 1) upChange = 1;
        else if (oldVote === 0 && value === -1) downChange = 1;
        
        return {
          ...prev,
          up_votes: prev.up_votes + upChange,
          down_votes: prev.down_votes + downChange,
          user_vote: value
        };
      });
    } catch (err) {
      console.error('Error voting on thread:', err);
    }
  };

  const handleCommentVote = async (commentId, value) => {
    try {
      await api.post(`/forums/comment/${commentId}/vote`, { value });
      await loadComments(); // Reload comments to get updated vote counts
    } catch (err) {
      console.error('Error voting on comment:', err);
    }
  };

  const handleCreateComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await api.post(`/forums/thread/${threadId}/comments`, {
        body: commentText
      });
      
      setCommentText('');
      await loadComments(); // Reload comments
      
      // Update thread comment count
      setThread(prev => ({
        ...prev,
        comment_count: (prev.comment_count || 0) + 1
      }));
    } catch (err) {
      console.error('Error creating comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (text, parentId) => {
    try {
      await api.post(`/forums/thread/${threadId}/comments`, {
        body: text,
        parent_id: parentId
      });
      
      await loadComments(); // Reload comments
      
      // Update thread comment count
      setThread(prev => ({
        ...prev,
        comment_count: (prev.comment_count || 0) + 1
      }));
    } catch (err) {
      console.error('Error replying:', err);
      throw err;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} min în urmă`;
    if (hours < 24) return `${hours}h în urmă`;
    return `${days}z în urmă`;
  };

  if (!user || user.subscription_tier !== 'PREMIUM') {
    navigate('/premium');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă discuția...</p>
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Eroare</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Înapoi
          </button>
        </div>
      </div>
    );
  }

  const getVoteScore = () => thread.up_votes - thread.down_votes;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MessageSquare size={16} />
              <span>{thread.comment_count || 0} comentarii</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Thread */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex">
            {/* Voting */}
            <div className="flex flex-col items-center justify-start p-6 bg-gray-50 rounded-l-lg">
              <button
                onClick={() => handleThreadVote(thread.user_vote === 1 ? 0 : 1)}
                className={`p-3 rounded hover:bg-gray-200 transition-colors ${
                  thread.user_vote === 1 ? 'text-orange-600 bg-orange-100' : 'text-gray-400'
                }`}
              >
                <ChevronUp size={24} />
              </button>
              
              <span className={`font-bold text-lg py-2 ${
                getVoteScore() > 0 ? 'text-orange-600' : 
                getVoteScore() < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {getVoteScore()}
              </span>
              
              <button
                onClick={() => handleThreadVote(thread.user_vote === -1 ? 0 : -1)}
                className={`p-3 rounded hover:bg-gray-200 transition-colors ${
                  thread.user_vote === -1 ? 'text-red-600 bg-red-100' : 'text-gray-400'
                }`}
              >
                <ChevronDown size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {thread.title}
              </h1>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center space-x-1">
                  <User size={14} />
                  <span>u/{thread.author_name || thread.author_id}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{formatTimeAgo(thread.created_at)}</span>
                </div>
              </div>

              <div className="text-gray-800 whitespace-pre-wrap mb-6">
                {thread.body}
              </div>

              {/* Attachments */}
              {thread.attachments && thread.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Anexe:</h4>
                  <div className="flex flex-wrap gap-3">
                    {thread.attachments.map((attachment, index) => (
                      <AttachmentPreview 
                        key={index} 
                        attachment={attachment} 
                        size="large"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Adaugă un comentariu
          </h3>
          
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Scrie comentariul tău aici..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={4}
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-gray-500">
              Fii respectuos și constructiv în comentariile tale.
            </div>
            
            <button
              onClick={handleCreateComment}
              disabled={!commentText.trim() || isSubmitting}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Se trimite...' : 'Comentează'}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Comentarii ({thread.comment_count || 0})
              </h3>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sortează:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="best">Cele mai bune</option>
                  <option value="newest">Cele mai noi</option>
                  <option value="oldest">Cele mai vechi</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loadingComments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Se încarcă comentariile...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Nu există comentarii încă
                </h4>
                <p className="text-gray-600">
                  Fii primul care comentează această discuție!
                </p>
              </div>
            ) : (
              <CommentTree
                comments={comments}
                onVote={handleCommentVote}
                onReply={handleReply}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;