import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Badge Notification Component - Popup pentru badge-uri noi câștigate
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
    }, 5000); // Auto-close după 5 secunde

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
              <span className="font-bold text-gray-800">Badge Câștigat!</span>
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

export default BadgeNotification;