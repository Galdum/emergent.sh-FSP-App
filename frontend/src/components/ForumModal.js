import React, { useEffect, useState } from "react";
import { Lock, MessageCircle, Send, Hash, PlusCircle, ArrowLeft, ChevronUp, ChevronDown, Clock, Users, TrendingUp, X, Link, User, Reply } from "react-feather";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

// Import enhanced text formatting components
import { FormatText, EnhancedTextarea, LinkInput, LinkAttachment, EmojiPicker } from "./forum/TextFormatter";

const ForumModal = ({ isOpen, onClose, onUpgrade }) => {
  // Get user data from AuthContext
  const { user, isAuthenticated } = useAuth();
  const isPremium = user?.subscription_tier === 'PREMIUM';
  // Navigation state
  const [currentView, setCurrentView] = useState('forums'); // 'forums', 'threads', 'thread'
  const [selectedForum, setSelectedForum] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  
  // Data state
  const [forums, setForums] = useState([]);
  const [threads, setThreads] = useState([]);
  const [comments, setComments] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Modal states
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [showCreateForum, setShowCreateForum] = useState(false);
  
  // Thread creation state
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadBody, setNewThreadBody] = useState("");
  const [threadAttachments, setThreadAttachments] = useState([]); // Only links now
  const [creatingThread, setCreatingThread] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Forum creation state
  const [newForumTitle, setNewForumTitle] = useState("");
  const [newForumDescription, setNewForumDescription] = useState("");
  const [newForumSlug, setNewForumSlug] = useState("");
  const [creatingForum, setCreatingForum] = useState(false);
  
  // Comment state
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Pagination and sorting
  const [threadsPage, setThreadsPage] = useState(1);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [threadSort, setThreadSort] = useState('recent');
  const [commentSort, setCommentSort] = useState('best');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Forum modal opened, isPremium:', isPremium);
      setCurrentView('forums');
      setSelectedForum(null);
      setSelectedThread(null);
      setError("");
      if (isPremium) {
        console.log('Loading forums for premium user...');
        loadForums();
      }
    }
  }, [isOpen, isPremium]);

  // Load forums
  const loadForums = async () => {
    if (!isPremium) {
      console.log('User is not premium, isPremium:', isPremium);
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      console.log('Loading forums...');
      console.log('Auth token from localStorage:', localStorage.getItem('auth_token'));
      console.log('User object:', user);
      
      const response = await api.getForums();
      console.log('API response:', response);
      console.log('Forums data:', response);
      
      // The API service returns response.data directly, so response is the forums array
      if (Array.isArray(response)) {
        setForums(response);
        console.log('Forums set to state:', response);
      } else {
        console.error('Unexpected response format:', response);
        setError("Format răspuns API neașteptat");
      }
    } catch (err) {
      console.error('Error loading forums:', err);
      console.error('Error response:', err.response);
      if (err.response?.status === 401) {
        setError("Problemă de autentificare. Te rugăm să te conectezi din nou.");
      } else if (err.response?.status === 403) {
        setError("Acces premium necesar pentru forum.");
      } else {
        setError("Eroare la încărcarea forumurilor: " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Load threads for a forum
  const loadThreads = async (forumSlug, reset = false, sortOrder = null) => {
    if (!isPremium) return;
    
    setLoading(reset);
    setError("");
    
    try {
      const page = reset ? 1 : threadsPage;
      const sort = sortOrder || threadSort; // Use provided sort or current state
      const response = await api.getForumThreads(forumSlug, page, sort);
      
      const newThreads = Array.isArray(response) ? response : [];
      
      if (reset) {
        setThreads(newThreads);
        setThreadsPage(2);
      } else {
        setThreads(prev => [...(prev || []), ...newThreads]);
        setThreadsPage(prev => (prev || 1) + 1);
      }
      
      setHasMoreThreads(newThreads.length === 20);
    } catch (err) {
      console.error('Error loading threads:', err);
      setError("Eroare la încărcarea discuțiilor.");
    } finally {
      setLoading(false);
    }
  };

  // Load thread details and comments
  const loadThreadDetails = async (threadId) => {
    if (!isPremium) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Load thread details
      const threadResponse = await api.getThread(threadId);
      setSelectedThread(threadResponse);
      
      // Load comments
      const commentsResponse = await api.getThreadComments(threadId, commentSort);
      setComments(Array.isArray(commentsResponse) ? commentsResponse : []);
    } catch (err) {
      console.error('Error loading thread:', err);
      setError("Eroare la încărcarea discuției.");
    } finally {
      setLoading(false);
    }
  };

  // Load comments for a thread
  const loadComments = async (threadId) => {
    setLoading(true);
    setError("");
    
    try {
      const commentsResponse = await api.getThreadComments(threadId, commentSort);
      setComments(Array.isArray(commentsResponse) ? commentsResponse : []);
    } catch (err) {
      console.error('Error loading comments:', err);
      if (err.response?.status === 401) {
        setError("Problemă de autentificare. Te rugăm să te conectezi din nou.");
      } else {
        setError("Eroare la încărcarea comentariilor: " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle forum navigation
  const handleNavigateToForum = (forum) => {
    setSelectedForum(forum);
    setCurrentView('threads');
    setThreads([]);
    setThreadsPage(1);
    loadThreads(forum.slug, true);
  };

  // Handle thread navigation
  const handleNavigateToThread = (thread) => {
    setSelectedThread(thread);
    setCurrentView('thread');
    loadThreadDetails(thread.id);
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentView === 'thread') {
      setCurrentView('threads');
      setSelectedThread(null);
      setComments([]);
      setCommentText("");
    } else if (currentView === 'threads') {
      setCurrentView('forums');
      setSelectedForum(null);
      setThreads([]);
    }
  };

  // Handle thread voting
  const handleThreadVote = async (threadId, value) => {
    try {
      await api.voteThread(threadId, value);
      
      // Update threads list if we're viewing threads
      if (currentView === 'threads') {
        setThreads(prev => (prev || []).map(thread => {
          if (thread.id === threadId) {
            const oldVote = thread.user_vote || 0;
            let upChange = 0;
            let downChange = 0;
            
            if (oldVote === 1 && value === 0) upChange = -1;
            else if (oldVote === 1 && value === -1) { upChange = -1; downChange = 1; }
            else if (oldVote === -1 && value === 0) downChange = -1;
            else if (oldVote === -1 && value === 1) { downChange = -1; upChange = 1; }
            else if (oldVote === 0 && value === 1) upChange = 1;
            else if (oldVote === 0 && value === -1) downChange = 1;
            
            return {
              ...thread,
              up_votes: thread.up_votes + upChange,
              down_votes: thread.down_votes + downChange,
              user_vote: value
            };
          }
          return thread;
        }));
      }
      
      // Update selected thread if we're viewing it
      if (currentView === 'thread' && selectedThread && selectedThread.id === threadId) {
        setSelectedThread(prev => {
          if (!prev) return prev;
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
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  // Handle comment voting
  const handleCommentVote = async (commentId, value) => {
    try {
      await api.voteComment(commentId, value);
      // Reload comments to get updated vote counts
      if (selectedThread) {
        const response = await api.get(`/forums/thread/${selectedThread.id}/comments`, {
          params: { sort: commentSort }
        });
        setComments(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      console.error('Error voting on comment:', err);
    }
  };

  // Handle link attachment
  const handleAddLink = (linkData) => {
    setThreadAttachments(prev => [...(prev || []), linkData]);
  };

  // Handle attachment removal
  const handleRemoveAttachment = (index) => {
    setThreadAttachments(prev => (prev || []).filter((_, i) => i !== index));
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewThreadBody(prev => (prev || '') + emoji);
    setShowEmojiPicker(false);
  };

  // Create forum
  const handleCreateForum = async () => {
    if (!newForumTitle.trim() || !newForumDescription.trim()) {
      setError('Titlul și descrierea sunt obligatorii');
      return;
    }

    // Generate slug from title if not provided
    let slug = newForumSlug.trim();
    if (!slug) {
      slug = newForumTitle.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    setCreatingForum(true);
    setError("");
    
    try {
      const response = await api.createForum(newForumTitle.trim(), newForumDescription.trim(), slug);

      // Add new forum to the list
      setForums(prev => [response, ...(prev || [])]);
      
      // Reset form
      setNewForumTitle("");
      setNewForumDescription("");
      setNewForumSlug("");
      setShowCreateForum(false);
    } catch (err) {
      console.error('Error creating forum:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Eroare la crearea forumului');
      }
    } finally {
      setCreatingForum(false);
    }
  };
  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadBody.trim()) {
      setError('Titlul și conținutul sunt obligatorii');
      return;
    }

    setCreatingThread(true);
    setError("");
    
    try {
      const response = await api.createThread(selectedForum.slug, newThreadTitle.trim(), newThreadBody.trim());

      // Add new thread to the list
      setThreads(prev => [response, ...(prev || [])]);
      
      // Reset form
      setNewThreadTitle("");
      setNewThreadBody("");
      setThreadAttachments([]);
      setShowCreateThread(false);
    } catch (err) {
      console.error('Error creating thread:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Eroare necunoscută';
      setError("Eroare la crearea thread-ului: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
    } finally {
      setCreatingThread(false);
    }
  };

  // Create comment
  const handleCreateComment = async () => {
    if (!commentText.trim() || !selectedThread) return;
    
    setIsSubmittingComment(true);
    setError("");
    
    try {
      await api.createComment(selectedThread.id, commentText.trim());
      
      setCommentText("");
      
      // Reload comments
      const response = await api.getThreadComments(selectedThread.id, commentSort);
      setComments(Array.isArray(response) ? response : []);
      
      // Update thread comment count
      setSelectedThread(prev => ({
        ...(prev || {}),
        comment_count: ((prev || {}).comment_count || 0) + 1
      }));
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('Eroare la crearea comentariului');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle reply to comment
  const handleReply = async (text, parentId) => {
    try {
      await api.post(`/forums/thread/${selectedThread.id}/comments`, {
        body: text,
        parent_id: parentId
      });
      
      // Reload comments
      const response = await api.get(`/forums/thread/${selectedThread.id}/comments`, {
        params: { sort: commentSort }
      });
      setComments(Array.isArray(response) ? response : []);
      
      // Update thread comment count
      setSelectedThread(prev => ({
        ...(prev || {}),
        comment_count: ((prev || {}).comment_count || 0) + 1
      }));
    } catch (err) {
      console.error('Error replying:', err);
      throw err;
    }
  };

  if (!isOpen) return null;

  if (!isAuthenticated || !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in-fast">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-scale-in">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
          >
            <X size={28} />
          </button>
          
          <div className="text-center">
            <Lock size={48} className="text-gray-400 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-2 text-gray-700">
              Conectare necesară
            </h2>
            <p className="text-gray-500 mb-6">
              Trebuie să te conectezi pentru a accesa forumul.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in-fast">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-scale-in">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
          >
            <X size={28} />
          </button>
          
          <div className="text-center">
            <Lock size={48} className="text-gray-400 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-2 text-gray-700">
              Forum Premium
            </h2>
            <p className="text-gray-500 mb-6">
              Accesul la forum este disponibil doar pentru utilizatorii cu abonament Premium.
            </p>
            
            {onUpgrade && (
              <button
                onClick={() => {
                  onClose();
                  onUpgrade();
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                Upgrade la Premium
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in-fast">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-20"
        >
          <X size={28} />
        </button>

        <div className="flex w-full h-full">
          {/* Forum List View */}
          {currentView === 'forums' && (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-6 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Forum Premium FSP Navigator</h2>
                    <p className="text-orange-100">
                      Comunitatea exclusivă pentru medicii care doresc să practice în Germania
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateForum(true)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <PlusCircle size={16} />
                    <span>Forum nou</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {loading && (forums || []).length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Se încarcă forumurile...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-red-600 mb-4">{error}</p>
                      <button
                        onClick={loadForums}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Încearcă din nou
                      </button>
                    </div>
                  </div>
                ) : (forums || []).length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="mx-auto mb-4 text-gray-400" size={64} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nu există forumuri încă
                    </h3>
                    <p className="text-gray-600">Forumurile vor fi disponibile în curând.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(forums || []).filter(forum => forum && forum.title).map((forum) => (
                      <div
                        key={forum.id}
                        onClick={() => handleNavigateToForum(forum)}
                        className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {forum?.title || 'Untitled Forum'}
                        </h3>
                        <p className="text-gray-600 mb-3">{forum?.description || 'No description'}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MessageCircle size={14} />
                            <span>{forum?.thread_count || 0} discuții</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>
                              Ultima activitate: {forum?.recent_activity ? 
                                new Date(forum.recent_activity).toLocaleDateString('ro-RO') : 
                                'Niciodată'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thread List View */}
          {currentView === 'threads' && selectedForum && (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b bg-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBack}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-semibold">{selectedForum.title}</h2>
                      <p className="text-gray-600 text-sm">{selectedForum.description}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowCreateThread(true)}
                    className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <PlusCircle size={16} />
                    <span>Discuție nouă</span>
                  </button>
                </div>
              </div>

              {/* Sorting */}
              <div className="p-4 bg-white border-b">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Sortează:</span>
                  {['recent', 'popular', 'oldest'].map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        setThreadSort(sort);
                        // Pass sort directly instead of relying on state
                        loadThreadsWithSort(selectedForum.slug, sort);
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        threadSort === sort 
                          ? 'bg-orange-100 text-orange-700 font-medium' 
                          : 'text-gray-600 hover:text-orange-600'
                      }`}
                    >
                      {sort === 'recent' ? 'Recent' : sort === 'popular' ? 'Popular' : 'Primul'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread List */}
              <div className="flex-1 p-4 overflow-y-auto">
                {loading && (threads || []).length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Se încarcă discuțiile...</p>
                    </div>
                  </div>
                ) : (threads || []).length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="mx-auto mb-4 text-gray-400" size={64} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nu există discuții încă
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Fii primul care începe o discuție în acest forum!
                    </p>
                    <button
                      onClick={() => setShowCreateThread(true)}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Creează prima discuție
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(threads || []).filter(thread => thread && thread.title).map((thread) => (
                      <div
                        key={thread.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex">
                          {/* Voting */}
                          <div className="flex flex-col items-center justify-start p-4 bg-gray-50 rounded-l-lg">
                            <button
                              onClick={() => handleThreadVote(thread.id, thread.user_vote === 1 ? 0 : 1)}
                              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                                thread.user_vote === 1 ? 'text-orange-600 bg-orange-100' : 'text-gray-400'
                              }`}
                            >
                              <ChevronUp size={16} />
                            </button>
                            
                            <span className={`text-sm font-semibold py-1 ${
                              ((thread?.up_votes || 0) - (thread?.down_votes || 0)) > 0 ? 'text-orange-600' : 
                              ((thread?.up_votes || 0) - (thread?.down_votes || 0)) < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {(thread?.up_votes || 0) - (thread?.down_votes || 0)}
                            </span>
                            
                            <button
                              onClick={() => handleThreadVote(thread.id, thread.user_vote === -1 ? 0 : -1)}
                              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                                thread.user_vote === -1 ? 'text-red-600 bg-red-100' : 'text-gray-400'
                              }`}
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>

                          {/* Content */}
                          <div 
                            className="flex-1 p-4 cursor-pointer"
                            onClick={() => handleNavigateToThread(thread)}
                          >
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors mb-2">
                              {thread?.title || 'Untitled Thread'}
                            </h3>
                            <div className="text-gray-700 mb-3">
                              <FormatText text={thread?.body || 'No content'} className="line-clamp-2" />
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span>u/{thread?.author_id || 'anonymous'}</span>
                                <span>{thread?.comment_count || 0} comentarii</span>
                              </div>
                              <span>
                                {thread?.created_at ? Math.floor((Date.now() - new Date(thread.created_at)) / (1000 * 60 * 60)) : 0}h în urmă
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {hasMoreThreads && (
                      <div className="text-center py-4">
                        <button
                          onClick={() => loadThreads(selectedForum.slug, false)}
                          disabled={loading}
                          className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Se încarcă...' : 'Încarcă mai multe'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thread Detail View */}
          {currentView === 'thread' && selectedThread && (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MessageCircle size={16} />
                    <span>{selectedThread.comment_count || 0} comentarii</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Thread Content */}
                <div className="p-6 border-b">
                  <div className="flex">
                    {/* Thread Voting */}
                    <div className="flex flex-col items-center justify-start mr-6">
                      <button
                        onClick={() => handleThreadVote(selectedThread.id, selectedThread.user_vote === 1 ? 0 : 1)}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          selectedThread.user_vote === 1 ? 'text-orange-600 bg-orange-100' : 'text-gray-400'
                        }`}
                      >
                        <ChevronUp size={20} />
                      </button>
                      
                      <span className={`text-lg font-bold py-2 ${
                        (selectedThread.up_votes - selectedThread.down_votes) > 0 ? 'text-orange-600' : 
                        (selectedThread.up_votes - selectedThread.down_votes) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {selectedThread.up_votes - selectedThread.down_votes}
                      </span>
                      
                      <button
                        onClick={() => handleThreadVote(selectedThread.id, selectedThread.user_vote === -1 ? 0 : -1)}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          selectedThread.user_vote === -1 ? 'text-red-600 bg-red-100' : 'text-gray-400'
                        }`}
                      >
                        <ChevronDown size={20} />
                      </button>
                    </div>

                    {/* Thread Info */}
                    <div className="flex-1">
                      <h1 className="text-xl font-bold text-gray-900 mb-4">
                        {selectedThread.title}
                      </h1>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <span>u/{selectedThread.author_id}</span>
                        <span>
                          {Math.floor((Date.now() - new Date(selectedThread.created_at)) / (1000 * 60 * 60))}h în urmă
                        </span>
                      </div>

                      <div className="text-gray-800 mb-4">
                        <FormatText text={selectedThread.body} />
                      </div>

                      {/* Attachments - Links only */}
                      {selectedThread && selectedThread.attachments && (selectedThread.attachments || []).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Link-uri:</h4>
                          <div className="space-y-2">
                            {(selectedThread.attachments || []).map((attachment, index) => (
                              <LinkAttachment 
                                key={index} 
                                url={attachment.url}
                                title={attachment.file_name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Form */}
                <div className="p-6 bg-gray-50 border-b">
                  <EnhancedTextarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Adaugă un comentariu..."
                    rows={3}
                    showToolbar={true}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          😀 Emoji
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute top-8 left-0 z-50">
                            <EmojiPicker 
                              onEmojiSelect={(emoji) => {
                                setCommentText(prev => (prev || '') + emoji);
                                setShowEmojiPicker(false);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleCreateComment}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      {isSubmittingComment ? 'Se trimite...' : 'Comentează'}
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">
                      Comentarii ({selectedThread.comment_count || 0})
                    </h3>
                    <select
                      value={commentSort}
                      onChange={(e) => {
                        setCommentSort(e.target.value);
                        loadThreadDetails(selectedThread.id);
                      }}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="best">Cele mai bune</option>
                      <option value="newest">Cele mai noi</option>
                      <option value="oldest">Cele mai vechi</option>
                    </select>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Se încarcă comentariile...</p>
                    </div>
                  ) : (comments || []).length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600">Nu există comentarii încă</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(comments || []).filter(comment => comment && comment.body).map((comment) => (
                        <div key={comment.id} className="bg-white rounded-lg border p-4">
                          <div className="flex">
                            <div className="flex flex-col items-center mr-4">
                              <button
                                onClick={() => handleCommentVote(comment.id, comment.user_vote === 1 ? 0 : 1)}
                                className={`p-1 rounded ${comment.user_vote === 1 ? 'text-orange-600' : 'text-gray-400'}`}
                              >
                                <ChevronUp size={14} />
                              </button>
                              <span className="text-xs font-semibold">
                                {(comment?.up_votes || 0) - (comment?.down_votes || 0)}
                              </span>
                              <button
                                onClick={() => handleCommentVote(comment.id, comment.user_vote === -1 ? 0 : -1)}
                                className={`p-1 rounded ${comment.user_vote === -1 ? 'text-red-600' : 'text-gray-400'}`}
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <span>u/{comment?.author_id || 'anonymous'}</span>
                                <span>
                                  {comment?.created_at ? Math.floor((Date.now() - new Date(comment.created_at)) / (1000 * 60)) : 0}min în urmă
                                </span>
                              </div>
                              <div className="text-gray-800">
                                <FormatText text={comment?.body || 'No content'} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create Thread Modal */}
          {showCreateThread && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Creează o discuție nouă</h3>
                    <button
                      onClick={() => {
                        setShowCreateThread(false);
                        setNewThreadTitle("");
                        setNewThreadBody("");
                        setThreadAttachments([]);
                      }}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Titlu</label>
                    <input
                      type="text"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Introdu un titlu descriptiv..."
                      maxLength={200}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {newThreadTitle.length}/200 caractere
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Conținut</label>
                    <EnhancedTextarea
                      value={newThreadBody}
                      onChange={(e) => setNewThreadBody(e.target.value)}
                      placeholder="Descrie problema, întrebarea sau subiectul..."
                      rows={8}
                      maxLength={5000}
                      showToolbar={true}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {newThreadBody.length}/5000 caractere
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Link-uri (opțional)</label>
                    
                    <div className="space-y-3">
                      <LinkInput onAddLink={handleAddLink} />
                      
                      {(threadAttachments || []).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Link-uri adăugate:</h4>
                          {(threadAttachments || []).map((attachment, index) => (
                            <LinkAttachment
                              key={index}
                              url={attachment.url}
                              title={attachment.file_name}
                              onRemove={() => handleRemoveAttachment(index)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Formatare disponibilă:</strong>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• **text** pentru <strong>bold</strong></div>
                      <div>• *text* pentru <em>italic</em></div>
                      <div>• `cod` pentru <code className="bg-gray-200 px-1 rounded">cod</code></div>
                      <div>• Link-urile sunt automat clickabile</div>
                      <div>• Tabele suportate cu format: | Header 1 | Header 2 |</div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowCreateThread(false);
                        setNewThreadTitle("");
                        setNewThreadBody("");
                        setThreadAttachments([]);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Anulează
                    </button>
                    <button
                      onClick={handleCreateThread}
                      disabled={!newThreadTitle.trim() || !newThreadBody.trim() || creatingThread}
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      {creatingThread ? 'Se creează...' : 'Creează discuția'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Forum Modal */}
          {showCreateForum && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
              <div className="bg-white rounded-lg w-full max-w-md">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Creează un forum nou</h3>
                    <button
                      onClick={() => {
                        setShowCreateForum(false);
                        setNewForumTitle("");
                        setNewForumDescription("");
                        setNewForumSlug("");
                      }}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Titlu forum</label>
                    <input
                      type="text"
                      value={newForumTitle}
                      onChange={(e) => setNewForumTitle(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="ex: Discuții generale"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Descriere</label>
                    <textarea
                      value={newForumDescription}
                      onChange={(e) => setNewForumDescription(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      placeholder="Descrie scopul acestui forum..."
                      rows={3}
                      maxLength={300}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Slug URL (opțional)
                    </label>
                    <input
                      type="text"
                      value={newForumSlug}
                      onChange={(e) => setNewForumSlug(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="ex: discutii-generale (se generează automat)"
                      maxLength={50}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Se va genera automat din titlu dacă nu este completat
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowCreateForum(false);
                        setNewForumTitle("");
                        setNewForumDescription("");
                        setNewForumSlug("");
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Anulează
                    </button>
                    <button
                      onClick={handleCreateForum}
                      disabled={!newForumTitle.trim() || !newForumDescription.trim() || creatingForum}
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      {creatingForum ? 'Se creează...' : 'Creează forum'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumModal;
