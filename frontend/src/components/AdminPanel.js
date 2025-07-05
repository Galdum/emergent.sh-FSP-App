import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, DollarSign, Activity, Settings, ChevronDown, ChevronRight, 
  Search, Filter, Download, AlertTriangle, CheckCircle, PlayCircle,
  Eye, Trash2, Edit, UserX, Plus, Save, X, Bell, Zap,
  BarChart3, TrendingUp, Clock, Shield, FileText, Globe,
  Database, RefreshCw, Copy, ExternalLink, Info, HelpCircle,
  Monitor, Smartphone, Mail, Calendar, Star, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const AdminPanel = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [utilDocs, setUtilDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [realTimeData, setRealTimeData] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const [newUtilDoc, setNewUtilDoc] = useState(null);
  const [editingUtilDoc, setEditingUtilDoc] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const intervalRef = useRef(null);
  const tutorialRef = useRef(null);
  const currentStatsRef = useRef(null);

  // Check if user is admin
  const isAdmin = user?.is_admin || user?.role === 'admin' || user?.email?.includes('admin') || false;

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadDashboardData();
      checkFirstTimeAccess();
      startRealTimeUpdates();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, isAdmin]);

  const checkFirstTimeAccess = () => {
    const hasSeenTutorial = localStorage.getItem(`admin_tutorial_${user?.id}`);
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  };

  const startRealTimeUpdates = () => {
    intervalRef.current = setInterval(async () => {
      try {
        const response = await api.get('/admin/stats');
        setRealTimeData(response);
        
        // Check for new notifications using current stats from ref
        if (notificationsEnabled && currentStatsRef.current) {
          const currentStats = currentStatsRef.current;
          if (response.transactions_today > (currentStats.transactions_today || 0)) {
            addNotification('New transaction received!', 'success');
          }
          if (response.total_users > (currentStats.total_users || 0)) {
            addNotification('New user registered!', 'info');
          }
        }
        
        // Update the current stats ref for next comparison
        currentStatsRef.current = response;
      } catch (error) {
        console.error('Real-time update failed:', error);
      }
    }, 30000); // Update every 30 seconds
  };

  const addNotification = (message, type = 'info') => {
    // Only add notification if notifications are enabled
    if (!notificationsEnabled) return;
    
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, transactionsData, errorsData, utilDocsData] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=50'),
        api.get('/admin/transactions?limit=30'),
        api.get('/admin/errors?limit=20&resolved=false'),
        api.get('/admin/util-info-docs')
      ]);

      setStats(statsData);
      setUsers(usersData);
      setTransactions(transactionsData);
      setErrors(errorsData);
      setUtilDocs(utilDocsData);
      setRealTimeData(statsData);
      
      // Initialize the current stats ref for real-time comparisons
      currentStatsRef.current = statsData;
    } catch (error) {
      console.error('Failed to load admin data:', error);
      addNotification('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveError = async (errorId) => {
    try {
      await api.patch(`/admin/errors/${errorId}/resolve`);
      setErrors(errors.filter(e => e.id !== errorId));
      addNotification('Error resolved successfully', 'success');
    } catch (error) {
      console.error('Failed to resolve error:', error);
      addNotification('Failed to resolve error', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Ești sigur că vrei să ștergi acest utilizator? Această acțiune nu poate fi anulată.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      addNotification('User deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete user:', error);
      addNotification('Failed to delete user', 'error');
    }
  };

  const handleUpdateUser = async (userId, updateData) => {
    try {
      await api.patch(`/admin/users/${userId}/subscription`, updateData);
      setUsers(users.map(u => u.id === userId ? { ...u, ...updateData } : u));
      setEditingUser(null);
      addNotification('User updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update user:', error);
      addNotification('Failed to update user', 'error');
    }
  };

  const handleToggleAdminStatus = async (userId, isAdmin) => {
    // Prevent self-demotion
    if (userId === user?.id && !isAdmin) {
      addNotification('Cannot remove your own admin privileges', 'error');
      return;
    }

    try {
      await api.patch(`/admin/users/${userId}/admin-status`, { is_admin: isAdmin });
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: isAdmin } : u));
      addNotification(`Admin status ${isAdmin ? 'granted' : 'revoked'} successfully`, 'success');
    } catch (error) {
      console.error('Failed to update admin status:', error);
      addNotification('Failed to update admin status', 'error');
    }
  };

  const handleCreateUtilDoc = async (docData) => {
    try {
      const response = await api.post('/admin/util-info-docs', docData);
      setUtilDocs([...utilDocs, response]);
      setNewUtilDoc(null);
      addNotification('Document created successfully', 'success');
    } catch (error) {
      console.error('Failed to create document:', error);
      addNotification('Failed to create document', 'error');
    }
  };

  const handleUpdateUtilDoc = async (docId, updateData) => {
    try {
      const response = await api.put(`/admin/util-info-docs/${docId}`, updateData);
      setUtilDocs(utilDocs.map(d => d.id === docId ? response : d));
      setEditingUtilDoc(null);
      addNotification('Document updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update document:', error);
      addNotification('Failed to update document', 'error');
    }
  };

  const handleDeleteUtilDoc = async (docId) => {
    if (!confirm('Ești sigur că vrei să ștergi acest document?')) {
      return;
    }

    try {
      await api.delete(`/admin/util-info-docs/${docId}`);
      setUtilDocs(utilDocs.filter(d => d.id !== docId));
      addNotification('Document deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete document:', error);
      addNotification('Failed to delete document', 'error');
    }
  };

  const startTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(0);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      completeTutorial();
    }
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    localStorage.setItem(`admin_tutorial_${user?.id}`, 'completed');
    addNotification('Tutorial completed! Welcome to the Admin Panel!', 'success');
  };

  const exportData = async (type) => {
    try {
      let data;
      let filename;
      
      switch (type) {
        case 'users':
          data = users;
          filename = 'users_export.json';
          break;
        case 'transactions':
          data = transactions;
          filename = 'transactions_export.json';
          break;
        case 'stats':
          data = stats;
          filename = 'stats_export.json';
          break;
        default:
          return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addNotification(`${type} data exported successfully`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      addNotification('Export failed', 'error');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tutorialSteps = [
    {
      title: 'Bine ai venit în Admin Panel!',
      content: 'Acest este centrul de control pentru întreaga aplicație. Aici poți gestiona utilizatori, monitoriza performanța și configura setările.',
      target: 'dashboard'
    },
    {
      title: 'Dashboard-ul Principal',
      content: 'Vezi statistici în timp real despre utilizatori, venituri și activitate. Datele se actualizează automat la fiecare 30 de secunde.',
      target: 'dashboard'
    },
    {
      title: 'Management Utilizatori',
      content: 'În secțiunea Users poți vizualiza, edita, promova la admin sau șterge utilizatori. Modificările se aplică instant.',
      target: 'users'
    },
    {
      title: 'Monitorizare Plăți',
      content: 'Secțiunea Payments îți permite să urmărești toate tranzacțiile și să identifici probleme cu plățile.',
      target: 'transactions'
    },
    {
      title: 'Gestiunea Documentelor',
      content: 'În Content poți gestiona documentele informative pentru utilizatori - adăuga, editează sau șterge conținut.',
      target: 'content'
    },
    {
      title: 'Rapoarte și Monitorizare',
      content: 'Secțiunea Errors îți arată toate problemele tehnice și îți permite să le rezolvi rapid.',
      target: 'errors'
    },
    {
      title: 'Gata!',
      content: 'Acum știi cum să folosești Admin Panel-ul. Poți reaccesa acest tutorial oricând din meniul Settings.',
      target: 'complete'
    }
  ];

  if (!isOpen || !isAdmin) return null;

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, description: 'Overview și statistici generale' },
    { id: 'users', name: 'Users', icon: Users, description: 'Gestiunea utilizatorilor' },
    { id: 'transactions', name: 'Payments', icon: DollarSign, description: 'Monitorizare plăți' },
    { id: 'content', name: 'Content', icon: FileText, description: 'Management conținut' },
    { id: 'errors', name: 'Errors', icon: AlertTriangle, description: 'Rapoarte erori' },
    { id: 'settings', name: 'Settings', icon: Settings, description: 'Configurări sistem' }
  ];

  const currentStats = realTimeData || stats;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex overflow-hidden relative">
        
        {/* Tutorial Overlay */}
        {showTutorial && (
          <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Tutorial ({tutorialStep + 1}/{tutorialSteps.length})
                </h3>
                <button
                  onClick={completeTutorial}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {tutorialSteps[tutorialStep].title}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {tutorialSteps[tutorialStep].content}
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-1">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index <= tutorialStep ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {tutorialStep > 0 && (
                    <button
                      onClick={() => setTutorialStep(tutorialStep - 1)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Înapoi
                    </button>
                  )}
                  <button
                    onClick={nextTutorialStep}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'Finalizează' : 'Următorul'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="absolute top-4 right-4 z-40 space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg shadow-lg max-w-sm ${
                  notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-800' :
                  notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-800' :
                  'bg-blue-100 border border-blue-400 text-blue-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notification.type === 'success' && <CheckCircle size={16} />}
                  {notification.type === 'error' && <AlertTriangle size={16} />}
                  {notification.type === 'info' && <Bell size={16} />}
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sidebar */}
        <div className="w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Admin Panel</h2>
            <p className="text-sm text-gray-600 mb-2">{user?.email}</p>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Updates Active
            </div>
          </div>

          {/* Quick Stats */}
          {currentStats && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Total Users</span>
                  <span className="text-sm font-bold text-blue-600">{currentStats.total_users}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Active Subs</span>
                  <span className="text-sm font-bold text-green-600">{currentStats.active_subscriptions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Today Revenue</span>
                  <span className="text-sm font-bold text-purple-600">€{currentStats.revenue_today?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-1 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Icon size={20} className={`${activeTab === tab.id ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'}`} />
                  <div className="flex-1">
                    <div className="font-medium">{tab.name}</div>
                    <div className={`text-xs ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="space-y-2">
            <button
              onClick={startTutorial}
              className="w-full flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <HelpCircle size={16} />
              <span className="text-sm">Tutorial</span>
            </button>
            
            <button
              onClick={loadDashboardData}
              className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="text-sm">Refresh Data</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full flex items-center gap-2 px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X size={16} />
              <span className="text-sm">Închide Panel</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Dashboard Overview</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => exportData('stats')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download size={16} />
                    Export Stats
                  </button>
                  <button 
                    onClick={loadDashboardData}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    disabled={loading}
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
              </div>
              
              {currentStats && (
                <>
                  {/* Real-time Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total Users</p>
                          <p className="text-3xl font-bold">{currentStats.total_users}</p>
                          <p className="text-xs text-blue-100 mt-1">
                            {currentStats.total_users > (stats?.total_users || 0) ? '+' : ''}
                            {currentStats.total_users - (stats?.total_users || 0)} since last update
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-3">
                          <Users size={24} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Active Subscriptions</p>
                          <p className="text-3xl font-bold">{currentStats.active_subscriptions}</p>
                          <p className="text-xs text-green-100 mt-1">
                            {currentStats.total_users > 0 ? (currentStats.active_subscriptions / currentStats.total_users * 100).toFixed(1) : '0'}% conversion
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-3">
                          <CheckCircle size={24} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                          <p className="text-3xl font-bold">€{currentStats.total_revenue?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-purple-100 mt-1">
                            €{currentStats.total_users > 0 ? (currentStats.total_revenue / currentStats.total_users).toFixed(2) : '0.00'} per user
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-3">
                          <DollarSign size={24} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Today's Revenue</p>
                          <p className="text-3xl font-bold">€{currentStats.revenue_today?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-orange-100 mt-1">
                            {currentStats.transactions_today || 0} transactions today
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-3">
                          <TrendingUp size={24} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Users by Plan Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">Users by Subscription Plan</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(currentStats.users_by_plan || {}).map(([plan, count]) => (
                        <div key={plan} className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-3xl font-bold text-gray-900">{count}</p>
                          <p className="text-sm text-gray-600 capitalize font-medium">{plan.toLowerCase()}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {currentStats.total_users > 0 ? ((count / currentStats.total_users) * 100).toFixed(1) : '0'}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800">Recent Users</h4>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{user.email}</p>
                              <p className="text-xs text-gray-500">
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.subscription_tier === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                              user.subscription_tier === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.subscription_tier}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800">System Health</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Database Connection</span>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-green-600">Connected</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">API Status</span>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-green-600">Operational</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Error Rate</span>
                          <span className="text-sm font-medium text-gray-900">{errors.length} active errors</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Last Update</span>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">User Management</h3>
                  <p className="text-gray-600">Manage all users, subscriptions and permissions</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => exportData('users')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download size={16} />
                    Export Users
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Plus size={16} />
                    Add User
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by email or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter size={16} />
                    Filter
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.email}</p>
                                <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                                {user.is_admin && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 mt-1">
                                    <Shield size={12} className="mr-1" />
                                    Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {editingUser?.id === user.id ? (
                              <select
                                value={editingUser.subscription_tier}
                                onChange={(e) => setEditingUser({...editingUser, subscription_tier: e.target.value})}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="FREE">Free</option>
                                <option value="BASIC">Basic</option>
                                <option value="PREMIUM">Premium</option>
                                <option value="ENTERPRISE">Enterprise</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                user.subscription_tier === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                                user.subscription_tier === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                                user.subscription_tier === 'ENTERPRISE' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.subscription_tier}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-gray-400" />
                              {user.total_files || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {editingUser?.id === user.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateUser(user.id, editingUser)}
                                    className="text-green-600 hover:text-green-800 p-1"
                                    title="Save changes"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-gray-600 hover:text-gray-800 p-1"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title="View details"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingUser(user)}
                                    className="text-gray-600 hover:text-gray-800 p-1"
                                    title="Edit user"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleToggleAdminStatus(user.id, !user.is_admin)}
                                    className={`p-1 ${user.is_admin ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                    title={user.is_admin ? 'Remove admin' : 'Make admin'}
                                  >
                                    <Shield size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Delete user"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Previous</button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Next</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Transaction History</h3>
                  <p className="text-gray-600">Monitor all payment transactions and revenue</p>
                </div>
                <button 
                  onClick={() => exportData('transactions')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download size={16} />
                  Export Transactions
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                            {transaction.id?.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{transaction.user_email || 'N/A'}</p>
                            <p className="text-sm text-gray-500">ID: {transaction.user_id?.slice(0, 8)}...</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-bold text-gray-900">€{transaction.amount?.toFixed(2) || '0.00'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.status || 'unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="View transaction details"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Content Management</h3>
                  <p className="text-gray-600">Manage utility documents and informational content</p>
                </div>
                <button 
                  onClick={() => setNewUtilDoc({ 
                    title: '', 
                    description: '', 
                    category: 'general',
                    content_type: 'rich-content',
                    rich_content: '',
                    is_active: true,
                    order_priority: 0
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus size={16} />
                  New Document
                </button>
              </div>
              
              {utilDocs.length === 0 && !newUtilDoc && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No documents found</p>
                  <p className="text-gray-400 text-sm">Add your first document to get started!</p>
                </div>
              )}

              <div className="grid gap-6">
                {utilDocs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-xl shadow-lg border p-6 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="text-xl font-semibold text-gray-900">{doc.title}</h5>
                          <span className="text-2xl">{doc.icon_emoji || '📄'}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            doc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {doc.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{doc.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">Category: {doc.category}</span>
                          <span>Type: {doc.content_type}</span>
                          <span>Order: {doc.order_priority}</span>
                          <span>Updated: {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingUtilDoc(doc)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Edit document"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUtilDoc(doc.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Delete document"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {doc.content_type === 'rich-content' && doc.rich_content && (
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-32 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: doc.rich_content.slice(0, 200) + (doc.rich_content.length > 200 ? '...' : '') }} />
                      </div>
                    )}
                    
                    {doc.content_type === 'link' && doc.external_url && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <a 
                          href={doc.external_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                        >
                          <ExternalLink size={16} />
                          {doc.external_url}
                        </a>
                      </div>
                    )}
                  </div>
                ))}

                {editingUtilDoc && (
                  <div className="bg-white rounded-xl shadow-lg border p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">Edit Document</h5>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingUtilDoc.title}
                            onChange={(e) => setEditingUtilDoc({ ...editingUtilDoc, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={editingUtilDoc.category}
                            onChange={(e) => setEditingUtilDoc({ ...editingUtilDoc, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="general">General</option>
                            <option value="land-specific">Land Specific</option>
                            <option value="alternatives">Alternatives</option>
                            <option value="support-groups">Support Groups</option>
                            <option value="youtube">YouTube Resources</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={editingUtilDoc.description}
                          onChange={(e) => setEditingUtilDoc({ ...editingUtilDoc, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {editingUtilDoc.content_type === 'rich-content' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                          <textarea
                            value={editingUtilDoc.rich_content}
                            onChange={(e) => setEditingUtilDoc({ ...editingUtilDoc, rich_content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="6"
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => setEditingUtilDoc(null)}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateUtilDoc(editingUtilDoc.id, editingUtilDoc)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {newUtilDoc && (
                  <div className="bg-white rounded-xl shadow-lg border p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">Create New Document</h5>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={newUtilDoc.title}
                            onChange={(e) => setNewUtilDoc({ ...newUtilDoc, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Document title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={newUtilDoc.category}
                            onChange={(e) => setNewUtilDoc({ ...newUtilDoc, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="general">General</option>
                            <option value="land-specific">Land Specific</option>
                            <option value="alternatives">Alternatives</option>
                            <option value="support-groups">Support Groups</option>
                            <option value="youtube">YouTube Resources</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={newUtilDoc.description}
                          onChange={(e) => setNewUtilDoc({ ...newUtilDoc, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Brief description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                        <select
                          value={newUtilDoc.content_type}
                          onChange={(e) => setNewUtilDoc({ ...newUtilDoc, content_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="rich-content">Rich Content</option>
                          <option value="link">External Link</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>
                      
                      {newUtilDoc.content_type === 'rich-content' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                          <textarea
                            value={newUtilDoc.rich_content}
                            onChange={(e) => setNewUtilDoc({ ...newUtilDoc, rich_content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="6"
                            placeholder="Document content (HTML supported)"
                          />
                        </div>
                      )}
                      
                      {newUtilDoc.content_type === 'link' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
                          <input
                            type="url"
                            value={newUtilDoc.external_url || ''}
                            onChange={(e) => setNewUtilDoc({ ...newUtilDoc, external_url: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com"
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => setNewUtilDoc(null)}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCreateUtilDoc(newUtilDoc)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          disabled={!newUtilDoc.title || !newUtilDoc.category}
                        >
                          Create Document
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Error Reports</h3>
                  <p className="text-gray-600">Monitor and resolve system errors</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Refresh size={16} />
                    Refresh Errors
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <CheckCircle size={16} />
                    Resolve All
                  </button>
                </div>
              </div>
              
              {errors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                  <p className="text-green-600 text-lg mb-2">No Active Errors!</p>
                  <p className="text-gray-500 text-sm">All systems are running smoothly</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errors.map((error) => (
                    <div key={error.id} className="bg-white border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-red-800 text-lg">{error.error_type || 'System Error'}</h4>
                              <p className="text-xs text-gray-500">
                                {error.timestamp ? new Date(error.timestamp).toLocaleString() : 'Unknown time'}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3 bg-gray-50 p-3 rounded-lg">
                            {error.error_message || error.message || 'No error message available'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {error.url && (
                              <div className="flex items-center gap-1">
                                <Globe size={14} />
                                <span>URL: {error.url}</span>
                              </div>
                            )}
                            {error.user_id && (
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                <span>User: {error.user_id.slice(0, 8)}...</span>
                              </div>
                            )}
                            {error.severity && (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                error.severity === 'high' ? 'bg-red-100 text-red-800' :
                                error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {error.severity} priority
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveError(error.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800">System Settings</h3>
                <p className="text-gray-600">Configure admin panel and system preferences</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                    <Settings size={20} />
                    General Settings
                  </h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Live Updates</span>
                        <p className="text-xs text-gray-500">Automatically refresh data every 30 seconds</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!intervalRef.current}
                          onChange={(e) => {
                            if (e.target.checked) {
                              startRealTimeUpdates();
                            } else {
                              clearInterval(intervalRef.current);
                              intervalRef.current = null;
                            }
                          }}
                          className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>
                                         <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                         <p className="text-xs text-gray-500">Show notifications for important events</p>
                       </div>
                       <label className="flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationsEnabled}
                           onChange={(e) => {
                             setNotificationsEnabled(e.target.checked);
                             if (!e.target.checked) {
                               // Clear existing notifications when disabling
                               setNotifications([]);
                             }
                           }}
                           className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                         />
                       </label>
                     </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tutorial Mode</span>
                        <p className="text-xs text-gray-500">Show/hide tutorial overlay</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showTutorial}
                          onChange={(e) => setShowTutorial(e.target.checked)}
                          className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* User Management Tools */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                    <Users size={20} />
                    User Management
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                      <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Search by email or ID..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportData('users')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <Download size={16} />
                        Export Users
                      </button>
                      <button
                        onClick={() => exportData('transactions')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Download size={16} />
                        Export Transactions
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                    <Monitor size={20} />
                    System Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Panel Version</span>
                      <span className="text-sm font-medium text-gray-900">v2.1.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Update</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Sessions</span>
                      <span className="text-sm font-medium text-gray-900">1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                    <Zap size={20} />
                    Quick Actions
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={startTutorial}
                      className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <HelpCircle size={18} />
                      <span className="font-medium">Restart Tutorial</span>
                    </button>
                    <button
                      onClick={loadDashboardData}
                      className="w-full flex items-center gap-3 px-4 py-3 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      disabled={loading}
                    >
                      <Refresh size={18} className={loading ? 'animate-spin' : ''} />
                      <span className="font-medium">Refresh All Data</span>
                    </button>
                    <button
                      onClick={() => exportData('stats')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <Download size={18} />
                      <span className="font-medium">Export Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem(`admin_tutorial_${user?.id}`);
                        addNotification('Tutorial reset! It will show again on next visit.', 'info');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X size={18} />
                      <span className="font-medium">Reset Tutorial</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default AdminPanel;