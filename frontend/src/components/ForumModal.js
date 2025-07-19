import React, { useEffect, useState } from "react";
import { Lock, MessageCircle, Send, Hash, PlusCircle, ArrowLeft, ChevronUp, ChevronDown, Clock, Users, TrendingUp, Upload, X, Link, FileText, Image, User, Reply } from "react-feather";
import { api } from "../services/api";

// Import the new forum components
import ForumCard from "./forum/ForumCard";
import ThreadCard from "./forum/ThreadCard";
import CommentTree from "./forum/CommentTree";
import AttachmentPreview from "./forum/AttachmentPreview";
import UpgradeBanner from "./forum/UpgradeBanner";

const ForumModal = ({ isOpen, onClose, isPremium, onUpgrade }) => {
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
  
  // Thread creation state
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadBody, setNewThreadBody] = useState("");
  const [threadAttachments, setThreadAttachments] = useState([]);
  const [creatingThread, setCreatingThread] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
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
      setCurrentView('forums');
      setSelectedForum(null);
      setSelectedThread(null);
      setError("");
      if (isPremium) {
        loadForums();
      }
    }
  }, [isOpen, isPremium]);

  // Load forums
  const loadForums = async () => {
    if (!isPremium) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await api.get('/forums/');
      setForums(response.data);
    } catch (err) {
      console.error('Error loading forums:', err);
      setError("Eroare la încărcarea forumurilor.");
    } finally {
      setLoading(false);
    }
  };

  // Load threads for a forum
  const loadThreads = async (forumSlug, reset = false) => {
    if (!isPremium) return;
    
    setLoading(reset);
    setError("");
    
    try {
      const page = reset ? 1 : threadsPage;
      const response = await api.get(`/forums/${forumSlug}/threads`, {
        params: {
          page,
          limit: 20,
          sort: threadSort
        }
      });
      
      const newThreads = response.data;
      
      if (reset) {
        setThreads(newThreads);
        setThreadsPage(2);
      } else {
        setThreads(prev => [...prev, ...newThreads]);
        setThreadsPage(prev => prev + 1);
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
      const threadResponse = await api.get(`/forums/thread/${threadId}`);
      setSelectedThread(threadResponse.data);
      
      // Load comments
      const commentsResponse = await api.get(`/forums/thread/${threadId}/comments`, {
        params: { sort: commentSort }
      });
      setComments(commentsResponse.data);
    } catch (err) {
      console.error('Error loading thread:', err);
      setError("Eroare la încărcarea discuției.");
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
      await api.post(`/forums/thread/${threadId}/vote`, { value });
      
      // Update threads list if we're viewing threads
      if (currentView === 'threads') {
        setThreads(prev => prev.map(thread => {
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
      await api.post(`/forums/comment/${commentId}/vote`, { value });
      // Reload comments to get updated vote counts
      if (selectedThread) {
        const response = await api.get(`/forums/thread/${selectedThread.id}/comments`, {
          params: { sort: commentSort }
        });
        setComments(response.data);
      }
    } catch (err) {
      console.error('Error voting on comment:', err);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/forums/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setThreadAttachments(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Eroare la încărcarea fișierelor');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Create thread
  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadBody.trim()) {
      setError('Titlul și conținutul sunt obligatorii');
      return;
    }

    setCreatingThread(true);
    setError("");
    
    try {
      const response = await api.post(`/forums/${selectedForum.slug}/threads`, {
        title: newThreadTitle.trim(),
        body: newThreadBody.trim(),
        attachments: threadAttachments
      });

      // Add new thread to the list
      setThreads(prev => [response.data, ...prev]);
      
      // Reset form
      setNewThreadTitle("");
      setNewThreadBody("");
      setThreadAttachments([]);
      setShowCreateThread(false);
    } catch (err) {
      console.error('Error creating thread:', err);
      setError('Eroare la crearea discuției');
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
      await api.post(`/forums/thread/${selectedThread.id}/comments`, {
        body: commentText.trim()
      });
      
      setCommentText("");
      
      // Reload comments
      const response = await api.get(`/forums/thread/${selectedThread.id}/comments`, {
        params: { sort: commentSort }
      });
      setComments(response.data);
      
      // Update thread comment count
      setSelectedThread(prev => ({
        ...prev,
        comment_count: (prev.comment_count || 0) + 1
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
      setComments(response.data);
      
      // Update thread comment count
      setSelectedThread(prev => ({
        ...prev,
        comment_count: (prev.comment_count || 0) + 1
      }));
    } catch (err) {
      console.error('Error replying:', err);
      throw err;
    }
  };

  if (!isOpen) return null;

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
              Accesibil doar pentru utilizatorii cu abonament Premium.
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
                <h2 className="text-2xl font-bold mb-2">Forum Premium FSP Navigator</h2>
                <p className="text-orange-100">
                  Comunitatea exclusivă pentru medicii care doresc să practice în Germania
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {loading && forums.length === 0 ? (
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
                ) : forums.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="mx-auto mb-4 text-gray-400" size={64} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nu există forumuri încă
                    </h3>
                    <p className="text-gray-600">Forumurile vor fi disponibile în curând.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {forums.map((forum) => (
                      <div
                        key={forum.id}
                        onClick={() => handleNavigateToForum(forum)}
                        className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {forum.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{forum.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MessageCircle size={14} />
                            <span>{forum.thread_count || 0} discuții</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>
                              Ultima activitate: {forum.recent_activity ? 
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
                        loadThreads(selectedForum.slug, true);
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
                {loading && threads.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Se încarcă discuțiile...</p>
                    </div>
                  </div>
                ) : threads.length === 0 ? (
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
                    {threads.map((thread) => (
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
                              (thread.up_votes - thread.down_votes) > 0 ? 'text-orange-600' : 
                              (thread.up_votes - thread.down_votes) < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {thread.up_votes - thread.down_votes}
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
                              {thread.title}
                            </h3>
                            <p className="text-gray-700 mb-3 line-clamp-2">{thread.body}</p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span>u/{thread.author_id}</span>
                                <span>{thread.comment_count || 0} comentarii</span>
                              </div>
                              <span>
                                {Math.floor((Date.now() - new Date(thread.created_at)) / (1000 * 60 * 60))}h în urmă
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

                      <div className="text-gray-800 whitespace-pre-wrap mb-4">
                        {selectedThread.body}
                      </div>

                      {/* Attachments */}
                      {selectedThread.attachments && selectedThread.attachments.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Anexe:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedThread.attachments.map((attachment, index) => (
                              <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {attachment.file_name || attachment.url}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Form */}
                <div className="p-6 bg-gray-50 border-b">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Adaugă un comentariu..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleCreateComment}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
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
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600">Nu există comentarii încă</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
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
                                {comment.up_votes - comment.down_votes}
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
                                <span>u/{comment.author_id}</span>
                                <span>
                                  {Math.floor((Date.now() - new Date(comment.created_at)) / (1000 * 60))}min în urmă
                                </span>
                              </div>
                              <div className="text-gray-800 whitespace-pre-wrap">
                                {comment.body}
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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Conținut</label>
                    <textarea
                      value={newThreadBody}
                      onChange={(e) => setNewThreadBody(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      placeholder="Descrie problema, întrebarea sau subiectul..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Anexe (opțional)</label>
                    <div className="flex items-center space-x-2 mb-4">
                      <label className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded cursor-pointer hover:bg-gray-200">
                        <Upload size={16} />
                        <span className="text-sm">Încarcă fișier</span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                      </label>
                      {uploadingFiles && (
                        <span className="text-sm text-orange-600">Se încarcă...</span>
                      )}
                    </div>

                    {threadAttachments.length > 0 && (
                      <div className="space-y-2">
                        {threadAttachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{attachment.file_name}</span>
                            <button
                              onClick={() => setThreadAttachments(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
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
