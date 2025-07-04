import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, ChevronRight } from 'lucide-react';

/**
 * Compact Badge Display Component - Shows recent badges and stats
 */
export const BadgeDisplay = ({ 
  currentUser, 
  onOpenBadgeSystem, 
  compact = false 
}) => {
  const [badges, setBadges] = useState([]);
  const [recentBadges, setRecentBadges] = useState([]);
  const [badgeProgress, setBadgeProgress] = useState({
    badge_count: 0,
    total_badges: 0
  });

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/badges/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const badgeData = await response.json();
      setBadges(badgeData);
      
      // Get recent badges (last 3 earned)
      const earnedBadges = badgeData
        .filter(b => b.earned)
        .sort((a, b) => new Date(b.awarded_at) - new Date(a.awarded_at))
        .slice(0, 3);
      
      setRecentBadges(earnedBadges);
      setBadgeProgress({
        badge_count: badgeData.filter(b => b.earned).length,
        total_badges: badgeData.length
      });
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
  };

  const getBadgeIcon = (badgeId) => {
    const iconMap = {
      'first_upload': '📄',
      'profile_complete': '👤',
      'chat_starter': '💬',
      'chat_marathon': '⚡',
      'checklist_begin': '✅',
      'checklist_master': '🏅',
      'fsp_simulator': '🎓',
      'doc_manager': '📁',
      'email_pro': '✉️',
      'tutorial_complete': '🎉',
      'daily_7': '🔥',
      'daily_30': '❄️',
      'referrer': '⭐',
      'social_butterfly': '🦋',
      'badge_collector': '🎯',
      'data_master': '🔍',
      'feedback_giver': '✏️',
      'land_explorer': '🗺️',
      'hospitation_hero': '🏥',
      'champion': '🏆'
    };
    return iconMap[badgeId] || '🏅';
  };

  const getBadgeColor = (badgeId) => {
    const colorMap = {
      'first_upload': 'bg-purple-500',
      'profile_complete': 'bg-teal-500',
      'chat_starter': 'bg-blue-500',
      'chat_marathon': 'bg-green-500',
      'checklist_begin': 'bg-orange-500',
      'checklist_master': 'bg-yellow-500',
      'fsp_simulator': 'bg-indigo-500',
      'doc_manager': 'bg-amber-600',
      'email_pro': 'bg-sky-500',
      'tutorial_complete': 'bg-pink-500',
      'daily_7': 'bg-red-500',
      'daily_30': 'bg-gray-400',
      'referrer': 'bg-yellow-400',
      'social_butterfly': 'bg-emerald-500',
      'badge_collector': 'bg-cyan-500',
      'data_master': 'bg-teal-600',
      'feedback_giver': 'bg-gray-500',
      'land_explorer': 'bg-orange-400',
      'hospitation_hero': 'bg-blue-600',
      'champion': 'bg-gradient-to-r from-yellow-400 to-orange-500'
    };
    return colorMap[badgeId] || 'bg-gray-400';
  };

  // Compact version for header/sidebar
  if (compact) {
    return (
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
        onClick={onOpenBadgeSystem}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-700">
              {badgeProgress.badge_count}/{badgeProgress.total_badges} Badges
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
        
        {recentBadges.length > 0 && (
          <div className="flex gap-1 mt-2">
            {recentBadges.map((badge, index) => (
              <div
                key={badge.badge_id}
                className={`w-6 h-6 rounded-full ${getBadgeColor(badge.badge_id)} text-white flex items-center justify-center text-xs`}
              >
                {getBadgeIcon(badge.badge_id)}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // Full version for profile/dashboard
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Badge Collection
        </h3>
        <button
          onClick={onOpenBadgeSystem}
          className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-800">
            {badgeProgress.badge_count}/{badgeProgress.total_badges}
          </span>
        </div>
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(badgeProgress.badge_count / badgeProgress.total_badges) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {Math.round((badgeProgress.badge_count / badgeProgress.total_badges) * 100)}% Complete
        </div>
      </div>

      {/* Recent Badges */}
      {recentBadges.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Recent Achievements
          </h4>
          <div className="space-y-2">
            {recentBadges.map((badge) => (
              <motion.div
                key={badge.badge_id}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                onClick={onOpenBadgeSystem}
              >
                <div className={`w-10 h-10 rounded-lg ${getBadgeColor(badge.badge_id)} text-white flex items-center justify-center`}>
                  <span className="text-lg">{getBadgeIcon(badge.badge_id)}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{badge.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(badge.awarded_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <div className="text-sm text-gray-500 mb-2">No badges yet</div>
          <div className="text-xs text-gray-400">Complete tasks to earn your first badge!</div>
        </div>
      )}

      {/* Quick Action */}
      <button
        onClick={onOpenBadgeSystem}
        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm"
      >
        View Badge Collection
      </button>
    </div>
  );
};

/**
 * Badge Notification Component - Shows popup when badge is earned
 */
export const BadgeNotification = ({ badge, onClose }) => {
  const getBadgeIcon = (badgeId) => {
    const iconMap = {
      'first_upload': '📄',
      'profile_complete': '👤',
      'chat_starter': '💬',
      'chat_marathon': '⚡',
      'checklist_begin': '✅',
      'checklist_master': '🏅',
      'fsp_simulator': '🎓',
      'doc_manager': '📁',
      'email_pro': '✉️',
      'tutorial_complete': '🎉',
      'daily_7': '🔥',
      'daily_30': '❄️',
      'referrer': '⭐',
      'social_butterfly': '🦋',
      'badge_collector': '🎯',
      'data_master': '🔍',
      'feedback_giver': '✏️',
      'land_explorer': '🗺️',
      'hospitation_hero': '🏥',
      'champion': '🏆'
    };
    return iconMap[badgeId] || '🏅';
  };

  const getBadgeColor = (badgeId) => {
    const colorMap = {
      'first_upload': 'bg-purple-500',
      'profile_complete': 'bg-teal-500',
      'chat_starter': 'bg-blue-500',
      'chat_marathon': 'bg-green-500',
      'checklist_begin': 'bg-orange-500',
      'checklist_master': 'bg-yellow-500',
      'fsp_simulator': 'bg-indigo-500',
      'doc_manager': 'bg-amber-600',
      'email_pro': 'bg-sky-500',
      'tutorial_complete': 'bg-pink-500',
      'daily_7': 'bg-red-500',
      'daily_30': 'bg-gray-400',
      'referrer': 'bg-yellow-400',
      'social_butterfly': 'bg-emerald-500',
      'badge_collector': 'bg-cyan-500',
      'data_master': 'bg-teal-600',
      'feedback_giver': 'bg-gray-500',
      'land_explorer': 'bg-orange-400',
      'hospitation_hero': 'bg-blue-600',
      'champion': 'bg-gradient-to-r from-yellow-400 to-orange-500'
    };
    return colorMap[badgeId] || 'bg-gray-400';
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="fixed bottom-8 right-8 z-50 max-w-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl border-l-4 border-purple-600 p-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl ${getBadgeColor(badge.badge_id)} text-white flex items-center justify-center flex-shrink-0`}>
            <span className="text-xl">{getBadgeIcon(badge.badge_id)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎉</span>
              <span className="font-bold text-gray-800">Badge Earned!</span>
            </div>
            <div className="font-medium text-gray-700">{badge.name}</div>
            <div className="text-sm text-gray-500 mt-1">{badge.description}</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default BadgeDisplay;