import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LegalModal from './LegalModal';

const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState(defaultMode); // 'login', 'register', or 'forgot-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (mode === 'register' && (!acceptedTerms || !acceptedPrivacy)) {
      setError('Trebuie să accepți Termenii și Condițiile și Politica de Confidențialitate.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'forgot-password') {
        const response = await api.post('/auth/forgot-password', { email });
        setMessage('If the email exists, a reset link has been sent');
        setMode('login');
      } else {
        const result = mode === 'login' 
          ? await login(email, password)
          : await register(email, password);

        if (result.success) {
          onClose();
          // Reset form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setMode('login');
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
    setError('');
    setMessage('');
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/google', {
        token: credentialResponse.credential
      });
      
      if (response.data) {
        onClose();
        // The auth context should handle the token storage
        window.location.reload(); // Simple approach to refresh auth state
      }
    } catch (error) {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setMessage('');
  };

  const getModalTitle = () => {
    switch(mode) {
      case 'login': return 'Autentificare';
      case 'register': return 'Cont Nou';
      case 'forgot-password': return 'Recuperare Parolă';
      default: return 'Autentificare';
    }
  };

  const getModalSubtitle = () => {
    switch(mode) {
      case 'login': return 'Intră în contul tău pentru a-ți accesa progresul';
      case 'register': return 'Creează un cont pentru a-ți salva progresul';
      case 'forgot-password': return 'Introdu email-ul pentru a primi un link de resetare';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4 animate-fade-in-fast">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md text-gray-800 p-6 relative transform animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          {mode === 'forgot-password' && (
            <button
              onClick={() => setMode('login')}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          
          <h2 className="text-2xl font-bold mb-2">
            {getModalTitle()}
          </h2>
          <p className="text-gray-600">
            {getModalSubtitle()}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2 text-green-700">
            <AlertCircle size={16} />
            <span className="text-sm">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="exemplu@email.com"
                required
              />
            </div>
          </div>

          {mode !== 'forgot-password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parolă
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmă Parola
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                />
                <span>
                  Sunt de acord cu{' '}
                  <button
                    type="button"
                    className="text-blue-600 underline hover:text-blue-800"
                    onClick={() => {
                      setLegalTab('terms');
                      setShowLegal(true);
                    }}
                  >
                    Termenii și Condițiile
                  </button>
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  required
                />
                <span>
                  Sunt de acord cu{' '}
                  <button
                    type="button"
                    className="text-blue-600 underline hover:text-blue-800"
                    onClick={() => {
                      setLegalTab('privacy');
                      setShowLegal(true);
                    }}
                  >
                    Politica de Confidențialitate
                  </button>
                </span>
              </label>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Ai uitat parola?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'register' && (!acceptedTerms || !acceptedPrivacy))}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold transition-colors"
          >
            {loading ? 'Se procesează...' : 
              mode === 'login' ? 'Intră în cont' : 
              mode === 'register' ? 'Creează cont' : 
              'Trimite link resetare'
            }
          </button>

          {mode !== 'forgot-password' && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">sau</span>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setError('Google login nu este încă disponibil')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuă cu Google
                </button>
              </div>
            </div>
          )}
        </form>

        {mode !== 'forgot-password' && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {mode === 'login' ? 'Nu ai cont?' : 'Ai deja cont?'}
              <button
                onClick={switchMode}
                className="ml-1 text-blue-600 hover:text-blue-700 font-semibold"
              >
                {mode === 'login' ? 'Înregistrează-te' : 'Autentifică-te'}
              </button>
            </p>
          </div>
        )}

        <LegalModal
          isOpen={showLegal}
          onClose={() => setShowLegal(false)}
          initialTab={legalTab}
        />
      </div>
    </div>
  );
};

export default AuthModal;