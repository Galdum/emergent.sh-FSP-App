import React, { useState, useEffect } from 'react';
import { X, Shield, Cookie, Info, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GDPRConsentModal = ({ isOpen, onAccept, onDecline, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Auto-show modal on first visit if no consent is stored
    const gdprConsent = localStorage.getItem('gdpr_consent');
    if (!gdprConsent && !isOpen) {
      // Trigger parent to show modal
      setTimeout(() => {
        // Modal should be shown by parent component
      }, 1000);
    }
  }, [isOpen]);

  const handleAccept = () => {
    const consentData = {
      accepted: true,
      date: new Date().toISOString(),
      version: '2.0-enhanced',
      ip: 'hashed', // In production, store hashed IP
      userAgent: navigator.userAgent,
      features: [
        'analytics',
        'functional',
        'performance'
      ]
    };
    
    localStorage.setItem('gdpr_consent', JSON.stringify(consentData));
    
    // Track consent acceptance
    console.log('✅ GDPR Consent accepted:', consentData);
    
    onAccept?.(consentData);
  };

  const handleDecline = () => {
    const declineData = {
      accepted: false,
      date: new Date().toISOString(),
      version: '2.0-enhanced'
    };
    
    localStorage.setItem('gdpr_consent', JSON.stringify(declineData));
    
    // Track consent decline
    console.log('❌ GDPR Consent declined:', declineData);
    
    onDecline?.(declineData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Cookie size={24} />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold">🍪 Politica de Confidențialitate Enhanced</h2>
                  <p className="text-sm opacity-90">Conformitate GDPR completă</p>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                <Shield className="text-blue-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Respectăm confidențialitatea ta</h3>
                  <p className="text-sm text-blue-700">
                    Folosim cookies și tehnologii moderne pentru a îmbunătăți experiența ta pe FSP Navigator Enhanced. 
                    Datele tale sunt procesate conform GDPR.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Check className="text-green-600" size={16} />
                  <span className="text-sm">Cookies funcționale pentru funcționarea aplicației</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Check className="text-green-600" size={16} />
                  <span className="text-sm">Analitice pentru îmbunătățirea serviciilor</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Check className="text-green-600" size={16} />
                  <span className="text-sm">Performanță pentru optimizarea vitezei</span>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mt-4 font-medium"
              >
                <Info size={16} />
                {showDetails ? 'Ascunde detaliile' : 'Vezi detaliile complete'}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gray-50 rounded-lg border"
                  >
                    <h4 className="font-semibold mb-2">Detalii GDPR:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Dreptul la ștergerea datelor (articolul 17)</li>
                      <li>• Dreptul la portabilitatea datelor (articolul 20)</li>
                      <li>• Dreptul la rectificare (articolul 16)</li>
                      <li>• Dreptul de opoziție (articolul 21)</li>
                      <li>• Stocarea sigură cu criptare</li>
                      <li>• Procesare minimă necesară</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Versiunea: 2.0-enhanced | Data: {new Date().toLocaleDateString('ro-RO')}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                <AlertTriangle className="text-orange-600 mt-1" size={16} />
                <p className="text-sm text-orange-700">
                  <strong>Important:</strong> Pentru a continua să folosești FSP Navigator Enhanced, 
                  este necesar să accepți acești termeni conform legislației europene GDPR.
                </p>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-lg"
              >
                ✅ Accept Termenii Enhanced
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDecline}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-all"
              >
                ❌ Refuz
              </motion.button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Prin acceptare, confirmi că ai citit și înțeles 
              <button className="text-blue-600 underline mx-1">Politica de Confidențialitate</button>
              și
              <button className="text-blue-600 underline mx-1">Termenii și Condițiile</button>
              Enhanced.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GDPRConsentModal;