import React, { useState, useEffect } from 'react';
import { Trophy, Star, Flame, Award, TrendingUp, Clock, Target, Zap, Crown, Medal } from 'lucide-react';

/**
 * Gamification Progress Display Component
 * Shows user progress, points, level, and achievements
 */
export const GamificationProgress = ({ 
  userStats, 
  achievements = [], 
  onAchievementClick,
  onOpenBadgeSystem,
  currentUser,
  compact = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animatePoints, setAnimatePoints] = useState(false);

  // Animate points when they change
  useEffect(() => {
    setAnimatePoints(true);
    const timer = setTimeout(() => setAnimatePoints(false), 500);
    return () => clearTimeout(timer);
  }, [userStats.points]);

  const getLevelIcon = (level) => {
    if (level >= 20) return <Crown className="h-6 w-6 text-purple-500" />;
    if (level >= 15) return <Medal className="h-6 w-6 text-yellow-500" />;
    if (level >= 10) return <Trophy className="h-6 w-6 text-yellow-600" />;
    if (level >= 5) return <Award className="h-6 w-6 text-blue-500" />;
    return <Star className="h-6 w-6 text-gray-500" />;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTimeSpent = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Compact version for header/sidebar
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getLevelIcon(userStats.level)}
            <div>
              <div className="font-bold text-lg">Nivel {userStats.level}</div>
              <div className="text-purple-200 text-sm">
                {userStats.points.toLocaleString()} puncte
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-orange-300">
              <Flame className="h-4 w-4" />
              <span className="font-semibold">{userStats.streakDays}</span>
            </div>
            <div className="text-purple-200 text-xs">zile consecutive</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-purple-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(userStats.experienceProgress)}`}
              style={{ width: `${userStats.experienceProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-purple-200 mt-1">
            {userStats.experience} / {userStats.experience + userStats.experienceToNext} XP
          </div>
        </div>
      </div>
    );
  }

  // Full version for dedicated progress page
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              {getLevelIcon(userStats.level)}
            </div>
            <div>
              <h2 className="text-3xl font-bold">Nivel {userStats.level}</h2>
              <p className="text-purple-200">
                {userStats.points.toLocaleString()} puncte totale
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 text-orange-300 text-xl font-bold">
              <Flame className="h-6 w-6" />
              {userStats.streakDays}
            </div>
            <p className="text-purple-200 text-sm">zile consecutive</p>
          </div>
        </div>

        {/* Experience Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progres către nivelul {userStats.level + 1}</span>
            <span>{userStats.experience} / {userStats.experience + userStats.experienceToNext} XP</span>
          </div>
          <div className="w-full bg-purple-800 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(userStats.experienceProgress)} relative overflow-hidden`}
              style={{ width: `${userStats.experienceProgress}%` }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-30 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Target className="h-5 w-5" />
            <span className="font-semibold">Step-uri</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{userStats.completedSteps}</div>
          <div className="text-sm text-gray-600">complete</div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Zap className="h-5 w-5" />
            <span className="font-semibold">Task-uri</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{userStats.completedTasks}</div>
          <div className="text-sm text-gray-600">finalizate</div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Award className="h-5 w-5" />
            <span className="font-semibold">Achievements</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{userStats.achievements}</div>
          <div className="text-sm text-gray-600">deblocate</div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Timp</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{formatTimeSpent(userStats.timeSpent)}</div>
          <div className="text-sm text-gray-600">petrecut</div>
        </div>
      </div>



      {/* Quiz Stats */}
      {userStats.quizStats && userStats.quizStats.totalQuizzes > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Statistici Quiz-uri
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userStats.quizStats.totalQuizzes}</div>
              <div className="text-sm text-gray-600">Quiz-uri completate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(userStats.quizStats.averageScore)}%
              </div>
              <div className="text-sm text-gray-600">Scor mediu</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats.quizStats.correctAnswers}</div>
              <div className="text-sm text-gray-600">Răspunsuri corecte</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Achievements Recente
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.slice(0, 4).map((achievement, index) => (
              <div 
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => onAchievementClick && onAchievementClick(achievement)}
              >
                <div className="text-2xl">🏆</div>
                <div>
                  <div className="font-semibold text-gray-800">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          {achievements.length > 4 && (
            <button 
              onClick={() => setShowDetails(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Vezi toate achievements-urile ({achievements.length})
            </button>
          )}
        </div>
      )}

      {/* Points Animation */}
      {animatePoints && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
            +{userStats.points} puncte!
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationProgress;