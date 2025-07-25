import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSubscription = () => {
  const { user, isAuthenticated, updateSubscription } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState('FREE');

  // Update subscription tier when user data changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setSubscriptionTier(user.subscription_tier || 'FREE');
    } else {
      // For unauthenticated users, check localStorage or default to FREE
      const localTier = localStorage.getItem('subscriptionTier');
      setSubscriptionTier(localTier || 'FREE');
    }
  }, [user, isAuthenticated]);

  const SUBSCRIPTION_TIERS = {
    FREE: { name: 'Free', price: 0, maxSteps: 2, maxOrangeNodes: 0, hasAI: false },
    BASIC: { name: 'Basic', price: 10, maxSteps: 6, maxOrangeNodes: 5, hasAI: false },
    PREMIUM: { name: 'Premium', price: 30, maxSteps: 6, maxOrangeNodes: 5, hasAI: true }
  };

  const getCurrentTier = () => SUBSCRIPTION_TIERS[subscriptionTier];

  const canAccessStep = (stepNumber) => {
    const tier = getCurrentTier();
    return stepNumber <= tier.maxSteps;
  };

  const canAccessOrangeNode = (nodeIndex) => {
    const tier = getCurrentTier();
    return nodeIndex < tier.maxOrangeNodes;
  };

  const hasAIAccess = () => {
    const tier = getCurrentTier();
    return tier.hasAI;
  };

  // Helper pentru a identifica nodurile AI/extra
  const isAIFeatureNode = (nodeId) => {
    // Lista de id-uri pentru noduri AI/extra (bonus)
    return ['fsp_tutor', 'email_gen', 'land_rec'].includes(nodeId);
  };

  // Acces la noduri AI/extra (bonus)
  const canAccessAIFeatureNode = (nodeId) => {
    // Doar la PREMIUM ai acces la AI/extra
    return subscriptionTier === 'PREMIUM' && isAIFeatureNode(nodeId);
  };

  const upgradeSubscription = async (newTier) => {
    try {
      if (isAuthenticated) {
        // Update via API
        const result = await updateSubscription(newTier);
        if (result.success) {
          setSubscriptionTier(newTier);
          return { success: true };
        } else {
          return { success: false, error: result.error };
        }
      } else {
        // Update localStorage for unauthenticated users (test mode)
        setSubscriptionTier(newTier);
        localStorage.setItem('subscriptionTier', newTier);
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      return { success: false, error: 'Upgrade failed' };
    }
  };

  return {
    subscriptionTier,
    getCurrentTier,
    canAccessStep,
    canAccessOrangeNode,
    hasAIAccess,
    upgradeSubscription,
    SUBSCRIPTION_TIERS,
    isAIFeatureNode,
    canAccessAIFeatureNode
  };
};