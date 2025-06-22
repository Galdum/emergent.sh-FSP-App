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

    setLoading(true);
    setError('');

    try {
      // Create checkout session
      const result = await api.post('/billing/checkout', {
        subscription_plan: planKey
      });

      // Redirect to Stripe Checkout
      window.location.href = result.url;
      
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setError('Failed to start payment process. Please try again.');
      setLoading(false);
    }
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

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>✓ Secure payment with Stripe • ✓ Cancel anytime • ✓ 30-day money back guarantee</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUpgrade;