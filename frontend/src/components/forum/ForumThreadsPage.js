import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, TrendingUp, Clock, MessageSquare, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import ThreadCard from './ThreadCard';
import CreateThreadModal from './CreateThreadModal';

const ForumThreadsPage = () => {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [forum, setForum] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Pagination and sorting
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  
  useEffect(() => {
    if (!user || user.subscription_tier !== 'PREMIUM') {
      return;
    }
    
    loadForum();
    loadThreads(true);
  }, [forumSlug, user, sortBy]);

  const loadForum = async () => {
    try {
      const response = await api.get(`/forums/${forumSlug}`);
      setForum(response.data);
    } catch (err) {
      console.error('Error loading forum:', err);
      setError('Forum nu a fost găsit');
    }
  };

  const loadThreads = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }
      
      const currentPage = reset ? 1 : page;
      const response = await api.get(`/forums/${forumSlug}/threads`, {
        params: {
          page: currentPage,
          limit: 20,
          sort: sortBy
        }
      });
      
      const newThreads = response.data;
      
      if (reset) {
        setThreads(newThreads);
      } else {
        setThreads(prev => [...prev, ...newThreads]);
      }
      
      setHasMore(newThreads.length === 20);
      setPage(prev => reset ? 2 : prev + 1);
      
    } catch (err) {
      console.error('Error loading threads:', err);
      if (reset) {
        setError('Eroare la încărcarea discuțiilor');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleVote = async (threadId, value) => {
    try {
      await api.post(`/forums/thread/${threadId}/vote`, { value });
      
      // Update local state optimistically
      setThreads(prev => prev.map(thread => {
        if (thread.id === threadId) {
          const oldVote = thread.user_vote || 0;
          const newVote = value;
          
          let upChange = 0;
          let downChange = 0;
          
          if (oldVote === 1 && newVote === 0) upChange = -1;
          else if (oldVote === 1 && newVote === -1) { upChange = -1; downChange = 1; }
          else if (oldVote === -1 && newVote === 0) downChange = -1;
          else if (oldVote === -1 && newVote === 1) { downChange = -1; upChange = 1; }
          else if (oldVote === 0 && newVote === 1) upChange = 1;
          else if (oldVote === 0 && newVote === -1) downChange = 1;
          
          return {
            ...thread,
            up_votes: thread.up_votes + upChange,
            down_votes: thread.down_votes + downChange,
            user_vote: newVote
          };
        }
        return thread;
      }));
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleThreadCreated = (newThread) => {
    setThreads(prev => [newThread, ...prev]);
    setShowCreateModal(false);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };

  if (!user || user.subscription_tier !== 'PREMIUM') {
    navigate('/premium');
    return null;
  }

  if (loading && threads.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă discuțiile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Eroare</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/premium')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Înapoi la Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/premium')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {forum?.title || forumSlug}
                </h1>
                <p className="text-gray-600">
                  {forum?.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus size={20} />
              <span>Discuție nouă</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Sortează:</span>
            
            <button
              onClick={() => handleSortChange('recent')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                sortBy === 'recent' 
                  ? 'bg-orange-100 text-orange-700 font-medium' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              <Clock size={14} />
              <span>Recent</span>
            </button>
            
            <button
              onClick={() => handleSortChange('popular')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                sortBy === 'popular' 
                  ? 'bg-orange-100 text-orange-700 font-medium' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              <TrendingUp size={14} />
              <span>Popular</span>
            </button>
            
            <button
              onClick={() => handleSortChange('oldest')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                sortBy === 'oldest' 
                  ? 'bg-orange-100 text-orange-700 font-medium' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              <MessageSquare size={14} />
              <span>Primul</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {threads.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nu există discuții încă
            </h2>
            <p className="text-gray-600 mb-6">
              Fii primul care începe o discuție în acest forum!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Creează prima discuție
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onNavigate={navigate}
                onVote={handleVote}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={() => loadThreads(false)}
                  disabled={loadingMore}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span>Se încarcă...</span>
                    </div>
                  ) : (
                    'Încarcă mai multe'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <CreateThreadModal
          forumSlug={forumSlug}
          onClose={() => setShowCreateModal(false)}
          onThreadCreated={handleThreadCreated}
        />
      )}
    </div>
  );
};

export default ForumThreadsPage;