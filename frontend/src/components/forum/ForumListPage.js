import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import ForumCard from './ForumCard';

const ForumListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.subscription_tier !== 'PREMIUM') {
      return;
    }
    
    loadForums();
  }, [user]);

  const loadForums = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/forums/');
      setForums(response.data);
    } catch (err) {
      console.error('Error loading forums:', err);
      setError('Eroare la încărcarea forumurilor');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Check if user has premium access
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Conectare necesară
          </h1>
          <p className="text-gray-600 mb-6">
            Trebuie să te conectezi pentru a accesa forumul.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Conectează-te
          </button>
        </div>
      </div>
    );
  }

  if (user.subscription_tier !== 'PREMIUM') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Shield className="mx-auto mb-4 text-gray-400" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Forum Premium
          </h1>
          <p className="text-gray-600 mb-6">
            Accesul la forum este disponibil doar pentru utilizatorii cu abonament Premium.
          </p>
          <button
            onClick={() => navigate('/upgrade')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Upgrade la Premium
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă forumurile...</p>
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
            onClick={loadForums}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Încearcă din nou
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Forum Premium FSP Navigator
              </h1>
              <p className="text-gray-600">
                Comunitatea exclusivă pentru medicii care doresc să practice în Germania
              </p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users size={16} />
                <span>Premium Members</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <MessageSquare size={16} />
                <span>{forums.reduce((total, forum) => total + (forum.thread_count || 0), 0)} discuții</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {forums.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nu există forumuri încă
            </h2>
            <p className="text-gray-600">
              Forumurile vor fi disponibile în curând.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Forumuri Disponibile
              </h2>
            </div>

            <div className="grid gap-6">
              {forums.map((forum) => (
                <ForumCard
                  key={forum.id}
                  forum={forum}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumListPage;