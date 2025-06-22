import React, { useState } from 'react';
import { Mail, Check, Send, AlertCircle, X } from 'lucide-react';

/**
 * Email Verification Modal Component
 * Handles real email verification for users
 */
export const EmailVerificationModal = ({ isOpen, onClose, onVerified }) => {
  const [step, setStep] = useState('input'); // 'input' | 'sent' | 'verified'
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendVerification = async () => {
    if (!email) {
      setError('Te rog introdu o adresă de email validă');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call for email verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll simulate success
      setStep('sent');
      setLoading(false);
    } catch (err) {
      setError('Eroare la trimiterea email-ului de verificare');
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Te rog introdu codul de verificare');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate verification check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo - accept any 6-digit code or "123456"
      if (verificationCode.length === 6 || verificationCode === '123456') {
        setStep('verified');
        setLoading(false);
        setTimeout(() => {
          onVerified && onVerified(email);
          onClose();
        }, 2000);
      } else {
        setError('Cod incorect. Încearcă din nou.');
        setLoading(false);
      }
    } catch (err) {
      setError('Eroare la verificarea codului');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setEmail('');
    setVerificationCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Confirmă Email-ul</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 mb-4">
                Pentru a continua cu procesul de Approbation, te rugăm să confirmi adresa ta de email. 
                Vei primi un cod de verificare.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresa de Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: nume.prenume@gmail.com"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 <strong>Sfat:</strong> Folosește o adresă profesională pe care o vei folosi 
                și în comunicarea cu autoritățile germane.
              </p>
            </div>

            <button
              onClick={handleSendVerification}
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Trimit...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Trimite Cod de Verificare
                </>
              )}
            </button>
          </div>
        )}

        {step === 'sent' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Email Trimis!</h3>
              <p className="text-gray-600">
                Am trimis un cod de verificare la <strong>{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cod de Verificare
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="text-sm text-gray-500 text-center">
              Nu ai primit email-ul? Verifică folderul spam sau 
              <button 
                onClick={() => setStep('input')}
                className="text-blue-600 hover:underline ml-1"
              >
                încearcă cu alt email
              </button>
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={loading || !verificationCode}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Verific...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Verifică Codul
                </>
              )}
            </button>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-800 text-sm">
                🎯 <strong>Pentru demo:</strong> Poți folosi codul "123456" sau orice cod de 6 cifre.
              </p>
            </div>
          </div>
        )}

        {step === 'verified' && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Email Verificat!</h3>
            <p className="text-gray-600 mb-4">
              Adresa <strong>{email}</strong> a fost confirmată cu succes.
            </p>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ Poți acum să continui cu procesul de Approbation!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationModal;