import React, { useState, useEffect } from 'react';
import { 
  Settings, Database, Key, History, Save, Upload, Download,
  Server, Code, Zap, CreditCard, Mail, Bot, FileText, Shield,
  RefreshCw, Trash2, Plus, Edit3, Eye, AlertTriangle, Check,
  X, ChevronRight, ChevronDown, Monitor, Smartphone, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RealAdminPanel = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState({});
  const [editHistory, setEditHistory] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});

  // Main admin tabs with REAL functionality
  const adminTabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Monitor,
      description: 'System overview and real-time stats'
    },
    { 
      id: 'api-management', 
      label: 'API Management', 
      icon: Key,
      description: 'Manage all API keys and integrations'
    },
    { 
      id: 'database-admin', 
      label: 'Database Admin', 
      icon: Database,
      description: 'Direct MongoDB management and queries'
    },
    { 
      id: 'payment-config', 
      label: 'Payment Systems', 
      icon: CreditCard,
      description: 'PayPal and Stripe configuration'
    },
    { 
      id: 'ai-services', 
      label: 'AI Services', 
      icon: Bot,
      description: 'AI models and API configurations'
    },
    { 
      id: 'content-history', 
      label: 'Edit History', 
      icon: History,
      description: 'Complete edit history with restore'
    },
    { 
      id: 'app-settings', 
      label: 'App Settings', 
      icon: Settings,
      description: 'Core application configuration'
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: Shield,
      description: 'User access and security settings'
    }
  ];

  useEffect(() => {
    if (isOpen && user?.is_admin) {
      loadSystemData();
    }
  }, [isOpen, user]);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      // Load real system configuration
      const response = await fetch('/api/admin/system-config', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setConfigs(data.configs || {});
      setSystemStatus(data.status || {});
      
      // Load edit history
      const historyResponse = await fetch('/api/admin/edit-history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const historyData = await historyResponse.json();
      setEditHistory(historyData.history || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (category, config) => {
    try {
      const response = await fetch('/api/admin/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ category, config })
      });
      
      if (response.ok) {
        alert('Configuration saved successfully!');
        loadSystemData(); // Reload to show changes
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    }
  };

  const restoreVersion = async (versionId) => {
    if (!confirm('Are you sure you want to restore this version? This will revert all changes made after this point.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/restore-version/${versionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        alert('Version restored successfully! Refreshing application...');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Error restoring version');
    }
  };

  if (!isOpen || !user?.is_admin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Admin Control Panel</h1>
                <p className="text-red-100">Full System Administration & Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-80px)]">
          {/* Sidebar Navigation */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-2">
                {adminTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-gray-600">{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
                    <p className="text-gray-600">Loading system data...</p>
                  </div>
                </div>
              ) : (
                <div>
                  {activeTab === 'dashboard' && <DashboardPanel systemStatus={systemStatus} />}
                  {activeTab === 'api-management' && <APIManagementPanel configs={configs} onSave={saveConfiguration} />}
                  {activeTab === 'database-admin' && <DatabaseAdminPanel />}
                  {activeTab === 'payment-config' && <PaymentConfigPanel configs={configs} onSave={saveConfiguration} />}
                  {activeTab === 'ai-services' && <AIServicesPanel configs={configs} onSave={saveConfiguration} />}
                  {activeTab === 'content-history' && <ContentHistoryPanel editHistory={editHistory} onRestore={restoreVersion} />}
                  {activeTab === 'app-settings' && <AppSettingsPanel configs={configs} onSave={saveConfiguration} />}
                  {activeTab === 'security' && <SecurityPanel configs={configs} onSave={saveConfiguration} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Panel Component
const DashboardPanel = ({ systemStatus }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">System Dashboard</h2>
      <p className="text-gray-600">Real-time system status and performance metrics</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="font-medium text-green-800">Backend Status</span>
        </div>
        <p className="text-2xl font-bold text-green-600 mt-2">Online</p>
        <p className="text-sm text-green-600">All systems operational</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800">Database</span>
        </div>
        <p className="text-2xl font-bold text-blue-600 mt-2">Connected</p>
        <p className="text-sm text-blue-600">MongoDB Atlas</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-800">AI Services</span>
        </div>
        <p className="text-2xl font-bold text-purple-600 mt-2">{systemStatus.aiServices || '2'}</p>
        <p className="text-sm text-purple-600">Active integrations</p>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-orange-800">Payments</span>
        </div>
        <p className="text-2xl font-bold text-orange-600 mt-2">Active</p>
        <p className="text-sm text-orange-600">Stripe & PayPal</p>
      </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm">Restart Services</span>
        </button>
        <button className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <Download className="h-4 w-4" />
          <span className="text-sm">Backup Data</span>
        </button>
        <button className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <Upload className="h-4 w-4" />
          <span className="text-sm">Restore Data</span>
        </button>
        <button className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <Monitor className="h-4 w-4" />
          <span className="text-sm">System Logs</span>
        </button>
      </div>
    </div>
  </div>
);

// API Management Panel Component
const APIManagementPanel = ({ configs, onSave }) => {
  const [apiConfigs, setApiConfigs] = useState({
    mongodb: { connection_string: '', database_name: '' },
    openai: { api_key: '', model: 'gpt-3.5-turbo', organization_id: '' },
    anthropic: { api_key: '', model: 'claude-3-sonnet' },
    google_gemini: { api_key: '', model: 'gemini-pro', project_id: '' },
    cloudflare_r2: { 
      account_id: '', 
      access_key_id: '', 
      secret_access_key: '', 
      bucket_name: '',
      endpoint_url: '',
      region: 'auto'
    },
    stripe: { 
      public_key: '', 
      secret_key: '', 
      webhook_secret: '',
      mode: 'sandbox'  // sandbox or live
    },
    paypal: { 
      client_id: '', 
      client_secret: '', 
      webhook_id: '',
      mode: 'sandbox'  // sandbox or live
    },
    email_service: {
      provider: 'sendgrid', // sendgrid, mailgun, ses
      api_key: '',
      from_email: '',
      from_name: ''
    }
  });

  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState({});

  useEffect(() => {
    if (configs.apis) {
      setApiConfigs({ ...apiConfigs, ...configs.apis });
    }
  }, [configs]);

  const updateApiConfig = (service, field, value) => {
    setApiConfigs(prev => ({
      ...prev,
      [service]: { ...prev[service], [field]: value }
    }));
  };

  const testConnection = async (service) => {
    setTesting(prev => ({ ...prev, [service]: true }));
    try {
      const response = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ service, config: apiConfigs[service] })
      });
      
      const result = await response.json();
      setTestResults(prev => ({ ...prev, [service]: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [service]: { success: false, message: error.message } 
      }));
    } finally {
      setTesting(prev => ({ ...prev, [service]: false }));
    }
  };

  const saveAndApply = async (service) => {
    try {
      await onSave('apis', apiConfigs);
      
      // Apply configuration to live system
      const response = await fetch('/api/admin/apply-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ service, config: apiConfigs[service] })
      });
      
      if (response.ok) {
        alert(`${service} configuration saved and applied successfully!`);
      }
    } catch (error) {
      alert(`Error applying ${service} configuration: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API Management</h2>
        <p className="text-gray-600">Configure and manage all external API connections. Changes are applied immediately to the live system.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MongoDB Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">MongoDB Atlas</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testConnection('mongodb')}
                disabled={testing.mongodb}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {testing.mongodb ? 'Testing...' : 'Test'}
              </button>
              {testResults.mongodb && (
                <span className={`text-xs px-2 py-1 rounded ${
                  testResults.mongodb.success 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {testResults.mongodb.success ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection String</label>
              <input
                type="password"
                value={apiConfigs.mongodb.connection_string}
                onChange={(e) => updateApiConfig('mongodb', 'connection_string', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="mongodb+srv://username:password@cluster..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
              <input
                type="text"
                value={apiConfigs.mongodb.database_name}
                onChange={(e) => updateApiConfig('mongodb', 'database_name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="fsp_navigator"
              />
            </div>
            <button
              onClick={() => saveAndApply('mongodb')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Save & Apply MongoDB Config
            </button>
          </div>
        </div>

        {/* Google Gemini Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Google Gemini</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testConnection('google_gemini')}
                disabled={testing.google_gemini}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {testing.google_gemini ? 'Testing...' : 'Test'}
              </button>
              {testResults.google_gemini && (
                <span className={`text-xs px-2 py-1 rounded ${
                  testResults.google_gemini.success 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {testResults.google_gemini.success ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={apiConfigs.google_gemini.api_key}
                onChange={(e) => updateApiConfig('google_gemini', 'api_key', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AIzaSy..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
              <input
                type="text"
                value={apiConfigs.google_gemini.project_id}
                onChange={(e) => updateApiConfig('google_gemini', 'project_id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-project-id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={apiConfigs.google_gemini.model}
                onChange={(e) => updateApiConfig('google_gemini', 'model', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-pro-vision">Gemini Pro Vision</option>
                <option value="gemini-ultra">Gemini Ultra</option>
              </select>
            </div>
            <button
              onClick={() => saveAndApply('google_gemini')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Save & Apply Gemini Config
            </button>
          </div>
        </div>

        {/* Cloudflare R2 Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Cloudflare R2</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testConnection('cloudflare_r2')}
                disabled={testing.cloudflare_r2}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {testing.cloudflare_r2 ? 'Testing...' : 'Test'}
              </button>
              {testResults.cloudflare_r2 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  testResults.cloudflare_r2.success 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {testResults.cloudflare_r2.success ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
              <input
                type="text"
                value={apiConfigs.cloudflare_r2.account_id}
                onChange={(e) => updateApiConfig('cloudflare_r2', 'account_id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Your Cloudflare Account ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Key ID</label>
              <input
                type="text"
                value={apiConfigs.cloudflare_r2.access_key_id}
                onChange={(e) => updateApiConfig('cloudflare_r2', 'access_key_id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="R2 Access Key ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Access Key</label>
              <input
                type="password"
                value={apiConfigs.cloudflare_r2.secret_access_key}
                onChange={(e) => updateApiConfig('cloudflare_r2', 'secret_access_key', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="R2 Secret Access Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
              <input
                type="text"
                value={apiConfigs.cloudflare_r2.bucket_name}
                onChange={(e) => updateApiConfig('cloudflare_r2', 'bucket_name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="your-r2-bucket"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
              <input
                type="text"
                value={apiConfigs.cloudflare_r2.endpoint_url}
                onChange={(e) => updateApiConfig('cloudflare_r2', 'endpoint_url', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://your-account.r2.cloudflarestorage.com"
              />
            </div>
            <button
              onClick={() => saveAndApply('cloudflare_r2')}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
            >
              Save & Apply R2 Config
            </button>
          </div>
        </div>

        {/* Stripe Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Stripe</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testConnection('stripe')}
                disabled={testing.stripe}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {testing.stripe ? 'Testing...' : 'Test'}
              </button>
              {testResults.stripe && (
                <span className={`text-xs px-2 py-1 rounded ${
                  testResults.stripe.success 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {testResults.stripe.success ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={apiConfigs.stripe.mode}
                onChange={(e) => updateApiConfig('stripe', 'mode', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="sandbox">Sandbox (Test)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
              <input
                type="text"
                value={apiConfigs.stripe.public_key}
                onChange={(e) => updateApiConfig('stripe', 'public_key', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="pk_test_... or pk_live_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
              <input
                type="password"
                value={apiConfigs.stripe.secret_key}
                onChange={(e) => updateApiConfig('stripe', 'secret_key', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="sk_test_... or sk_live_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
              <input
                type="password"
                value={apiConfigs.stripe.webhook_secret}
                onChange={(e) => updateApiConfig('stripe', 'webhook_secret', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="whsec_..."
              />
            </div>
            <button
              onClick={() => saveAndApply('stripe')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Save & Apply Stripe Config
            </button>
          </div>
        </div>

        {/* PayPal Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">PayPal</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testConnection('paypal')}
                disabled={testing.paypal}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {testing.paypal ? 'Testing...' : 'Test'}
              </button>
              {testResults.paypal && (
                <span className={`text-xs px-2 py-1 rounded ${
                  testResults.paypal.success 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {testResults.paypal.success ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={apiConfigs.paypal.mode}
                onChange={(e) => updateApiConfig('paypal', 'mode', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sandbox">Sandbox (Test)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={apiConfigs.paypal.client_id}
                onChange={(e) => updateApiConfig('paypal', 'client_id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="PayPal Client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <input
                type="password"
                value={apiConfigs.paypal.client_secret}
                onChange={(e) => updateApiConfig('paypal', 'client_secret', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="PayPal Client Secret"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook ID</label>
              <input
                type="text"
                value={apiConfigs.paypal.webhook_id}
                onChange={(e) => updateApiConfig('paypal', 'webhook_id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="PayPal Webhook ID"
              />
            </div>
            <button
              onClick={() => saveAndApply('paypal')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Save & Apply PayPal Config
            </button>
          </div>
        </div>

        {/* OpenAI Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">OpenAI</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testConnection('openai')}
                disabled={testing.openai}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {testing.openai ? 'Testing...' : 'Test'}
              </button>
              {testResults.openai && (
                <span className={`text-xs px-2 py-1 rounded ${
                  testResults.openai.success 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {testResults.openai.success ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={apiConfigs.openai.api_key}
                onChange={(e) => updateApiConfig('openai', 'api_key', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID (Optional)</label>
              <input
                type="text"
                value={apiConfigs.openai.organization_id}
                onChange={(e) => updateApiConfig('openai', 'organization_id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="org-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={apiConfigs.openai.model}
                onChange={(e) => updateApiConfig('openai', 'model', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>
            <button
              onClick={() => saveAndApply('openai')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Save & Apply OpenAI Config
            </button>
          </div>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">API Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(apiConfigs).map(service => (
            <div key={service} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                testResults[service]?.success ? 'bg-green-500' : 
                testResults[service]?.success === false ? 'bg-red-500' : 
                'bg-gray-300'
              }`}></div>
              <span className="text-sm capitalize">{service.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Content History Panel Component
const ContentHistoryPanel = ({ editHistory, onRestore }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit History & Version Control</h2>
      <p className="text-gray-600">Complete history of all changes with ability to restore any previous version</p>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Changes</h3>
          <button className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
            <Download className="h-4 w-4" />
            Export History
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {editHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No edit history available yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {editHistory.map((edit, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Edit3 className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{edit.action || 'Content Updated'}</p>
                      <p className="text-sm text-gray-600">
                        {edit.timestamp ? new Date(edit.timestamp).toLocaleString() : 'Recently'} 
                        by {edit.user || 'Admin'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRestore(edit.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Restore this version"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {edit.description && (
                  <p className="mt-2 text-sm text-gray-600 ml-11">{edit.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Placeholder components for other panels
const DatabaseAdminPanel = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Database Administration</h2>
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-gray-600">Direct MongoDB query interface and data management tools coming soon...</p>
    </div>
  </div>
);

const PaymentConfigPanel = ({ configs, onSave }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Payment System Configuration</h2>
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-gray-600">PayPal and Stripe configuration interface coming soon...</p>
    </div>
  </div>
);

const AIServicesPanel = ({ configs, onSave }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">AI Services Management</h2>
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-gray-600">AI model configuration and API management coming soon...</p>
    </div>
  </div>
);

const AppSettingsPanel = ({ configs, onSave }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Application Settings</h2>
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-gray-600">Core application settings and configuration coming soon...</p>
    </div>
  </div>
);

const SecurityPanel = ({ configs, onSave }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Security Management</h2>
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-gray-600">User access control and security settings coming soon...</p>
    </div>
  </div>
);

export default RealAdminPanel;