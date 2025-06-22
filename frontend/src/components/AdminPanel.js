import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Activity, Settings, ChevronDown, 
  Search, Filter, Download, AlertTriangle, CheckCircle,
  Eye, Trash2, Edit, UserX
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
  const [loading, setLoading] = useState(false);

  // Check if user is admin (you can expand this logic)
  const isAdmin = user?.email?.includes('admin') || false;

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadDashboardData();
    }
  }, [isOpen, isAdmin]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, transactionsData, errorsData] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=20'),
        api.get('/admin/transactions?limit=20'),
        api.get('/admin/errors?limit=20&resolved=false')
      ]);

      setStats(statsData);
      setUsers(usersData);
      setTransactions(transactionsData);
      setErrors(errorsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveError = async (errorId) => {
    try {
      await api.patch(`/admin/errors/${errorId}/resolve`);
      setErrors(errors.filter(e => e.id !== errorId));
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (!isOpen || !isAdmin) return null;

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Activity },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'transactions', name: 'Payments', icon: DollarSign },
    { id: 'errors', name: 'Errors', icon: AlertTriangle },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {tab.name}
                </button>
              );
            })}
          </nav>

          <button
            onClick={onClose}
            className="mt-8 w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
          >
            Close Panel
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6">Dashboard Overview</h3>
              
              {stats && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{stats.total_users}</p>
                        </div>
                        <Users className="text-blue-600" size={24} />
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Active Subscriptions</p>
                          <p className="text-2xl font-bold text-green-900">{stats.active_subscriptions}</p>
                        </div>
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium">Total Revenue</p>
                          <p className="text-2xl font-bold text-purple-900">€{stats.total_revenue.toFixed(2)}</p>
                        </div>
                        <DollarSign className="text-purple-600" size={24} />
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 text-sm font-medium">Today's Revenue</p>
                          <p className="text-2xl font-bold text-orange-900">€{stats.revenue_today.toFixed(2)}</p>
                        </div>
                        <Activity className="text-orange-600" size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Users by Plan */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4">Users by Plan</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(stats.users_by_plan).map(([plan, count]) => (
                        <div key={plan} className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{count}</p>
                          <p className="text-sm text-gray-600 capitalize">{plan.toLowerCase()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">User Management</h3>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download size={16} />
                    Export Users
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Files</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.email}</p>
                              <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              user.subscription_tier === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                              user.subscription_tier === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.subscription_tier}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.total_files}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:text-blue-800">
                                <Eye size={16} />
                              </button>
                              <button className="text-gray-600 hover:text-gray-800">
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6">Error Reports</h3>
              
              <div className="space-y-4">
                {errors.map((error) => (
                  <div key={error.id} className="bg-white border border-red-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="text-red-500" size={16} />
                          <h4 className="font-semibold text-red-800">{error.error_type}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{error.error_message}</p>
                        {error.url && (
                          <p className="text-xs text-gray-500">URL: {error.url}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleResolveError(error.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;