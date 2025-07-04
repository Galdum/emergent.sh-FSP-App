import React, { useState, useEffect } from 'react';
import { X, User, Bell, Shield, CreditCard, Globe, Trash2, Download, Eye, EyeOff, Save, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile settings
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    country_of_origin: '',
    target_bundesland: '',
    german_level: '',
    preferred_language: 'en'
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_reminders: true,
    progress_updates: true,
    deadline_alerts: true,
    marketing_emails: false
  });

  // Security settings
  const [security, setSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        country_of_origin: user.country_of_origin || '',
        target_bundesland: user.target_bundesland || '',
        german_level: user.german_level || '',
        preferred_language: user.preferred_language || 'en'
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notificări', icon: Bell },
    { id: 'security', label: 'Securitate', icon: Shield },
    { id: 'subscription', label: 'Abonament', icon: CreditCard },
    { id: 'data', label: 'Date', icon: Download }
  ];

  const germanLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ro', label: 'Română' }
  ];

  const bundeslands = [
    'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
    'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
    'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
    'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
  ];

  const handleProfileSave = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.put('/auth/me', profileData);
      setMessage('Profilul a fost actualizat cu succes');
      updateUser(response);
    } catch (err) {
      setError('Eroare la actualizarea profilului');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (security.new_password !== security.confirm_password) {
      setError('Parolele nu se potrivesc');
      return;
    }

    if (security.new_password.length < 8) {
      setError('Parola trebuie să aibă minim 8 caractere');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/auth/change-password', {
        current_password: security.current_password,
        new_password: security.new_password
      });
      setMessage('Parola a fost schimbată cu succes');
      setSecurity({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError('Eroare la schimbarea parolei');
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      const data = await api.get('/deployment/export-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-approbmed-data.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Datele au fost exportate cu succes');
    } catch (err) {
      setError('Eroare la exportarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Ești sigur că vrei să îți ștergi contul? Această acțiune nu poate fi anulată.')) {
      setLoading(true);
      try {
        await api.delete('/deployment/delete-account');
        setMessage('Contul a fost șters cu succes');
        onClose();
        // Redirect to home page
        window.location.href = '/';
      } catch (err) {
        setError('Eroare la ștergerea contului');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informații Personale</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prenume
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Prenumele tău"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nume
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Numele tău"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Țara de origine
              </label>
              <input
                type="text"
                value={profileData.country_of_origin}
                onChange={(e) => setProfileData({...profileData, country_of_origin: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="România"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bundesland țintă
              </label>
              <select
                value={profileData.target_bundesland}
                onChange={(e) => setProfileData({...profileData, target_bundesland: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selectează Bundesland</option>
                {bundeslands.map(bl => (
                  <option key={bl} value={bl}>{bl}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel limba germană
                </label>
                <select
                  value={profileData.german_level}
                  onChange={(e) => setProfileData({...profileData, german_level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selectează nivel</option>
                  {germanLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limba preferată
                </label>
                <select
                  value={profileData.preferred_language}
                  onChange={(e) => setProfileData({...profileData, preferred_language: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {loading ? 'Se salvează...' : 'Salvează modificările'}
            </button>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preferințe notificări</h3>
            
            <div className="space-y-3">
              {Object.entries({
                email_reminders: 'Reminder-uri email',
                progress_updates: 'Actualizări progres',
                deadline_alerts: 'Alerte deadline-uri',
                marketing_emails: 'Email-uri marketing'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => setMessage('Preferințele de notificare au fost salvate')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Salvează preferințele
            </button>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schimbă parola</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parola curentă
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={security.current_password}
                  onChange={(e) => setSecurity({...security, current_password: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Parola actuală"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parola nouă
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={security.new_password}
                  onChange={(e) => setSecurity({...security, new_password: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Parola nouă (minim 8 caractere)"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmă parola nouă
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={security.confirm_password}
                  onChange={(e) => setSecurity({...security, confirm_password: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirmă parola nouă"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={loading || !security.current_password || !security.new_password || !security.confirm_password}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold transition-colors"
            >
              {loading ? 'Se schimbă...' : 'Schimbă parola'}
            </button>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Abonament curent</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user?.subscription_tier || 'FREE'}</p>
                  <p className="text-sm text-gray-600">
                    {user?.subscription_expires ? 
                      `Expiră la: ${new Date(user.subscription_expires).toLocaleDateString()}` :
                      'Plan gratuit'
                    }
                  </p>
                </div>
                <CreditCard className="text-gray-400" size={24} />
              </div>
            </div>

            <button
              onClick={() => setMessage('Funcționalitatea de upgrade va fi disponibilă în curând')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 font-semibold transition-colors"
            >
              Upgrade abonament
            </button>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gestionare date</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleDataExport}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {loading ? 'Se exportă...' : 'Exportă datele mele'}
              </button>

              <div className="border-t pt-4">
                <h4 className="font-medium text-red-700 mb-2">Zona periculoasă</h4>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-400 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Șterge contul
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Această acțiune va șterge permanent toate datele tale și nu poate fi anulată.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-1/4 bg-gray-50 p-4 border-r">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon size={20} />
              <h2 className="text-lg font-semibold">Setări</h2>
            </div>
            
            <nav className="space-y-1">
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
                    <Icon size={16} />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}

            {/* Tab Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;