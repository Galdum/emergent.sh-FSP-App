import React, { useState, useEffect } from 'react';
import { X, Crown, Zap, Star, Check, AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import PayPalSubscription from './PayPalSubscription';

const SubscriptionUpgrade = ({ isOpen, onClose, targetPlan = null }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState({});
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' or 'paypal'

  // Load subscription plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plansData = await api.get('/billing/plans');
        setPlans(plansData);
      } catch (error) {
        console.error('Failed to load subscription plans:', error);
      }
    };

    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  // Check for payment completion on page load
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId && isAuthenticated) {
        setProcessingPayment(true);
        await pollPaymentStatus(sessionId);
      }
    };

    checkPaymentStatus();
  }, [isAuthenticated]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setError('Payment verification timed out. Please contact support if your payment was processed.');
      setProcessingPayment(false);
      return;
    }

    try {
      const result = await api.get(`/billing/payment-status/${sessionId}`);
      
      if (result.payment_status === 'paid') {
        // Payment successful - reload user data
        window.location.href = '/subscription-success';
        return;
      } else if (result.status === 'expired' || result.status === 'cancelled') {
        setError('Payment was cancelled or expired. Please try again.');
        setProcessingPayment(false);
        return;
      }

      // Continue polling if still pending
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError('Error verifying payment status. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handleUpgrade = async (planKey) => {
    if (!isAuthenticated) {
      setError('Please log in to upgrade your subscription.');
      return;
    }

    setSelectedPlan(planKey);
    // Don't create checkout session immediately - let user choose payment method
  };

  const handleStripeCheckout = async (planKey) => {
    setLoading(true);
    setError('');

    try {
      // Create Stripe checkout session
      const result = await api.post('/billing/checkout', {
        subscription_plan: planKey
      });

      // Redirect to Stripe Checkout
      window.location.href = result.url;
      
    } catch (error) {
      console.error('Failed to create Stripe checkout session:', error);
      setError('Failed to start Stripe payment process. Please try again.');
      setLoading(false);
    }
  };

  const handlePayPalSuccess = (result) => {
    console.log('PayPal subscription successful:', result);
    setProcessingPayment(false);
    setError('');
    
    // Show success message and close modal
    alert(`Subscripția ${result.subscription_tier} a fost activată cu succes prin PayPal!`);
    window.location.reload(); // Refresh to update user state
  };

  const handlePayPalError = (error) => {
    console.error('PayPal subscription error:', error);
    setError('A apărut o eroare cu PayPal. Te rugăm să încerci din nou.');
    setProcessingPayment(false);
  };

  const handlePayPalCancel = () => {
    console.log('PayPal payment cancelled');
    setSelectedPlan(null); // Go back to plan selection
  };

  const getPlanIcon = (planKey) => {
    switch (planKey) {
      case 'BASIC':
        return <Star className="h-8 w-8 text-blue-600" />;
      case 'PREMIUM':
        return <Crown className="h-8 w-8 text-purple-600" />;
      default:
        return <Zap className="h-8 w-8 text-gray-600" />;
    }
  };

  const getPlanColor = (planKey) => {
    switch (planKey) {
      case 'BASIC':
        return 'border-blue-500';
      case 'PREMIUM':
        return 'border-purple-500';
      default:
        return 'border-gray-300';
    }
  };

  const isCurrentPlan = (planKey) => {
    return user?.subscription_tier === planKey;
  };

  if (!isOpen) return null;

  // Show payment processing screen
  if (processingPayment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md text-gray-800 p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold mb-2">Processing Payment</h3>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4 animate-fade-in-fast">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl text-gray-800 p-6 md:p-8 relative transform animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
          <X size={28} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Upgrade Your Plan</h2>
          <p className="text-gray-600">Choose the perfect plan for your medical licensing journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([planKey, plan]) => (
            <div key={planKey} className={`border-2 ${getPlanColor(planKey)} rounded-xl p-6 relative`}>
              {isCurrentPlan(planKey) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Current Plan
                </div>
              )}
              
              {planKey === 'PREMIUM' && (
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-4">
                {getPlanIcon(planKey)}
                <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold">€{plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {planKey === 'FREE' ? (
                <button 
                  disabled
                  className="w-full py-3 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                >
                  Free Plan
                </button>
              ) : isCurrentPlan(planKey) ? (
                <button 
                  disabled
                  className="w-full py-3 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button 
                  onClick={() => handleUpgrade(planKey)}
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    planKey === 'PREMIUM'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  } disabled:opacity-50`}
                >
                  {loading ? 'Processing...' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Payment Method Selection Modal */}
        {selectedPlan && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-center mb-4">
                Alege Metoda de Plată
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Plan selectat: <strong>{plans[selectedPlan]?.name}</strong> - €{plans[selectedPlan]?.price}/lună
              </p>

              {paymentMethod === 'stripe' && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                      <h4 className="font-semibold">Stripe - Card de Credit/Debit</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Procesare securizată prin Stripe. Acceptă Visa, Mastercard, American Express.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStripeCheckout(selectedPlan)}
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Se procesează...' : 'Continuă cu Stripe'}
                      </button>
                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        PayPal
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="space-y-4">
                  <PayPalSubscription
                    planType={selectedPlan}
                    planDetails={plans[selectedPlan]}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                    onCancel={handlePayPalCancel}
                  />
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 mt-4"
                  >
                    ← Înapoi la Stripe
                  </button>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setPaymentMethod('stripe');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anulează
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>✓ Plată securizată cu Stripe & PayPal • ✓ Anulează oricând • ✓ Garanție 30 zile</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUpgrade;