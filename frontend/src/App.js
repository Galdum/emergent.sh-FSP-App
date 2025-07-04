import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FileProvider } from './contexts/FileContext';
import Sidebar from './components/Sidebar';
import Main from './components/Main';
import AuthModal from './components/AuthModal';
import InteractiveTutorial from './components/InteractiveTutorial';
import GDPRConsentModal from './components/GDPRConsentModal';
import './index.css';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [gdprModalOpen, setGdprModalOpen] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Check for tutorial and GDPR consent on app load
  useEffect(() => {
    // Check GDPR consent
    const gdprConsent = localStorage.getItem('gdpr_consent');
    if (!gdprConsent) {
      // Show GDPR modal after 1 second for new users
      setTimeout(() => {
        setGdprModalOpen(true);
      }, 1000);
    }

    // Check tutorial status
    const tutorialData = localStorage.getItem('tutorialViewed');
    if (!tutorialData && user) {
      // Show tutorial after GDPR consent or after 2 seconds for returning users
      setTimeout(() => {
        setTutorialOpen(true);
      }, gdprConsent ? 500 : 2000);
    }

    // Show welcome message for new users
    if (user && !tutorialData) {
      setShowWelcomeMessage(true);
      setTimeout(() => setShowWelcomeMessage(false), 5000);
    }
  }, [user]);

  const handleLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
  };

  const handleTutorialComplete = () => {
    setTutorialOpen(false);
    // Show tutorial completion message
    setTimeout(() => {
      alert('🎉 Felicitări! Ai finalizat tutorialul Enhanced. Acum poți explora toate funcționalitățile FSP Navigator.');
    }, 500);
  };

  const handleGdprAccept = (consentData) => {
    console.log('✅ GDPR Enhanced Consent accepted:', consentData);
    setGdprModalOpen(false);
    
    // Show tutorial after GDPR acceptance for new users
    if (user) {
      const tutorialData = localStorage.getItem('tutorialViewed');
      if (!tutorialData) {
        setTimeout(() => {
          setTutorialOpen(true);
        }, 500);
      }
    }
  };

  const handleGdprDecline = (declineData) => {
    console.log('❌ GDPR Enhanced Consent declined:', declineData);
    setGdprModalOpen(false);
    alert('Pentru a utiliza FSP Navigator Enhanced, acceptarea termenilor GDPR este obligatorie conform legislației europene.');
    // Optionally redirect to external page or show limited functionality
  };

  const startTutorial = () => {
    setTutorialOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-enhanced mb-4"></div>
          <p className="text-gray-600 font-medium">🚀 Se încarcă FSP Navigator Enhanced...</p>
          <p className="text-sm text-gray-500 mt-2">Pregătim experiența ta îmbunătățită</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex overflow-hidden">
      {/* Enhanced Welcome Message */}
      {showWelcomeMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
            <h3 className="font-semibold">🎉 Bine ai venit la FSP Navigator Enhanced!</h3>
            <p className="text-sm opacity-90">Experiență îmbunătățită cu funcții avansate</p>
          </div>
        </div>
      )}

      {/* Enhanced Sidebar */}
      <div className="w-64 bg-white shadow-xl border-r border-gray-200 animate-slide-in-left">
        <Sidebar 
          onLogin={handleLogin} 
          onRegister={handleRegister}
          onStartTutorial={startTutorial}
        />
      </div>

      {/* Enhanced Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden animate-fade-in-fast">
        <Main />
      </div>

      {/* Enhanced Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleAuthModalClose}
        defaultMode={authModalMode}
      />

      {/* Enhanced Interactive Tutorial */}
      <InteractiveTutorial
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onComplete={handleTutorialComplete}
      />

      {/* Enhanced GDPR Consent Modal */}
      <GDPRConsentModal
        isOpen={gdprModalOpen}
        onAccept={handleGdprAccept}
        onDecline={handleGdprDecline}
        onClose={() => setGdprModalOpen(false)}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <FileProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<AppContent />} />
              <Route path="/dashboard" element={<AppContent />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </FileProvider>
    </AuthProvider>
  );
};

export default App;