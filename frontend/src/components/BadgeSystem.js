import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Flame, Award, Lock, X, Users, Crown, Medal } from 'lucide-react';

/**
 * Badge System Component - Displays user badges with animations and leaderboard
 */
export const BadgeSystem = ({ currentUser, onClose }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [activeTab, setActiveTab] = useState('badges');
  const [leaderboard, setLeaderboard] = useState([]);
  const [newBadgePopup, setNewBadgePopup] = useState(null);

  useEffect(() => {
    fetchBadges();
    fetchLeaderboard();
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
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/badges/leaderboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const leaderboardData = await response.json();
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const checkForNewBadges = async () => {
    try {
      const response = await fetch('/api/badges/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.newly_awarded && result.newly_awarded.length > 0) {
        // Show popup for first new badge
        const newBadge = badges.find(b => b.badge_id === result.newly_awarded[0]);
        if (newBadge) {
          setNewBadgePopup(newBadge);
          // Refresh badges to show updated status
          fetchBadges();
        }
      }
    } catch (error) {
      console.error('Failed to check for new badges:', error);
    }
  };

  const getBadgeIcon = (badgeId, iconConcept) => {
    // Map badge IDs to appropriate Lucide icons as fallbacks
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

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Badge Collection</h2>
                <p className="text-purple-200">
                  {earnedBadges.length} of {badges.length} badges earned
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-purple-800 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(earnedBadges.length / badges.length) * 100}%` }}
              />
            </div>
            <div className="text-purple-200 text-sm mt-1">
              {Math.round((earnedBadges.length / badges.length) * 100)}% Complete
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('badges')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'badges' 
                  ? 'border-purple-500 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Badges
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'leaderboard' 
                  ? 'border-purple-500 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4" />
              Leaderboard
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'badges' && (
            <div>
              {/* Quick Actions */}
              <div className="mb-6">
                <button
                  onClick={checkForNewBadges}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Check for New Badges
                </button>
              </div>

              {/* Earned Badges */}
              {earnedBadges.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Earned Badges ({earnedBadges.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {earnedBadges.map((badge) => (
                      <motion.div
                        key={badge.badge_id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedBadge(badge)}
                        className="cursor-pointer"
                      >
                        <div className={`aspect-square rounded-2xl ${getBadgeColor(badge.badge_id)} text-white p-4 flex items-center justify-center shadow-lg hover:shadow-xl transition-all`}>
                          <span className="text-3xl">{getBadgeIcon(badge.badge_id, badge.icon_concept)}</span>
                        </div>
                        <div className="text-center mt-2">
                          <div className="font-medium text-sm text-gray-800">{badge.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(badge.awarded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked Badges */}
              {lockedBadges.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-500" />
                    Locked Badges ({lockedBadges.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {lockedBadges.map((badge) => (
                      <motion.div
                        key={badge.badge_id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedBadge(badge)}
                        className="cursor-pointer"
                      >
                        <div className="aspect-square rounded-2xl bg-gray-300 text-gray-500 p-4 flex items-center justify-center shadow-lg hover:shadow-xl transition-all relative">
                          <span className="text-3xl opacity-50">{getBadgeIcon(badge.badge_id, badge.icon_concept)}</span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <div className="font-medium text-sm text-gray-500">{badge.name}</div>
                          <div className="text-xs text-gray-400">Locked</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Top Badge Collectors
              </h3>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div key={user.user_id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.badge_count} badges</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {user.top_badges.slice(0, 3).map((badge, i) => (
                          <div key={i} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                            {getBadgeIcon(badge.badge_id)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="text-center">
                <div className={`w-24 h-24 rounded-2xl ${selectedBadge.earned ? getBadgeColor(selectedBadge.badge_id) : 'bg-gray-300'} text-white mx-auto mb-4 flex items-center justify-center shadow-lg relative`}>
                  <span className="text-4xl">{getBadgeIcon(selectedBadge.badge_id, selectedBadge.icon_concept)}</span>
                  {!selectedBadge.earned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedBadge.name}</h3>
                <p className="text-gray-600 mb-4">{selectedBadge.description}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${selectedBadge.earned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {selectedBadge.earned ? 'Earned' : selectedBadge.criteria}
                </div>
                {selectedBadge.earned && selectedBadge.awarded_at && (
                  <div className="text-sm text-gray-500 mt-2">
                    Earned on {new Date(selectedBadge.awarded_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full mt-6 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Badge Popup */}
      <AnimatePresence>
        {newBadgePopup && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed bottom-8 right-8 z-70"
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-2xl shadow-2xl max-w-sm">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl ${getBadgeColor(newBadgePopup.badge_id)} flex items-center justify-center`}>
                  <span className="text-2xl">{getBadgeIcon(newBadgePopup.badge_id, newBadgePopup.icon_concept)}</span>
                </div>
                <div>
                  <div className="font-bold text-lg">🎉 Badge Earned!</div>
                  <div className="text-purple-200">{newBadgePopup.name}</div>
                  <div className="text-sm text-purple-300 mt-1">{newBadgePopup.description}</div>
                </div>
              </div>
              <button
                onClick={() => setNewBadgePopup(null)}
                className="absolute top-2 right-2 text-purple-200 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BadgeSystem;