import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star, Zap, Target, Clock, Award, Users, Gamepad2, Play, RefreshCw, X } from 'lucide-react';
import { InteractiveQuiz } from './InteractiveQuiz';
import { gamificationManager } from '../utils/gamificationManager';

/**
 * Leaderboard and Competitions Component
 * Handles user rankings, competitive mini-games, and social challenges
 */
export const LeaderboardModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedCategory, setSelectedCategory] = useState('total');
  const [activeCompetition, setActiveCompetition] = useState(null);
  const [activeMiniGame, setActiveMiniGame] = useState(null);
  const [userRankings, setUserRankings] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  // Mini Games Quiz Data
  const miniGamesData = {
    fachbegriffe: {
      title: "⚡ Fachbegriffe Flash",
      timeLimit: 0.5, // 30 seconds
      questions: [
        {
          question: "Ce înseamnă 'Schmerzen' în română?",
          options: ["Dureri", "Febră", "Greață", "Amețeală"],
          correctAnswer: 0
        },
        {
          question: "Cum se spune 'inimă' în germană?",
          options: ["Leber", "Herz", "Lunge", "Niere"],
          correctAnswer: 1
        },
        {
          question: "Ce înseamnă 'Atemnot'?",
          options: ["Durere de cap", "Dificultate în respirație", "Durere de stomac", "Febră"],
          correctAnswer: 1
        },
        {
          question: "Cum se spune 'medic' în germană?",
          options: ["Pfleger", "Arzt", "Patient", "Schwester"],
          correctAnswer: 1
        },
        {
          question: "Ce înseamnă 'Übelkeit'?",
          options: ["Durere", "Febră", "Greață", "Oboseală"],
          correctAnswer: 2
        },
        {
          question: "Cum se spune 'cap' în germană?",
          options: ["Kopf", "Hals", "Arm", "Bein"],
          correctAnswer: 0
        },
        {
          question: "Ce înseamnă 'Fieber'?",
          options: ["Durere", "Febră", "Tuse", "Răceală"],
          correctAnswer: 1
        },
        {
          question: "Cum se spune 'sânge' în germană?",
          options: ["Wasser", "Blut", "Luft", "Haut"],
          correctAnswer: 1
        }
      ]
    },
    diagnostic: {
      title: "🔍 Diagnostic Express",
      timeLimit: null, // No time limit
      questions: [
        {
          question: "Pacient de 45 ani, bărbat, prezintă durere toracică intensă, irradiată în brațul stâng, transpirații reci și dispnee. Care este cel mai probabil diagnostic?",
          options: ["Pneumonie", "Infarct miocardic acut", "Reflux gastroesofagian", "Anxietate"],
          correctAnswer: 1
        },
        {
          question: "Femeie de 28 ani prezintă febră de 39°C, durere de cap intensă, rigiditate cervicală și fotofobia. Diagnostic?",
          options: ["Gripă", "Meningită", "Sinuzită", "Migrene"],
          correctAnswer: 1
        },
        {
          question: "Copil de 6 ani cu febră, durere în gât, ganglioni măriți și placaj alb pe amigdale. Diagnostic?",
          options: ["Laringită", "Angină streptococică", "Gripă", "Bronșită"],
          correctAnswer: 1
        },
        {
          question: "Pacient de 60 ani cu durere abdominală în fosă iliacă dreaptă, febră și leucocitoză. Diagnostic?",
          options: ["Gastrită", "Apendicită", "Colecistită", "Pancreatită"],
          correctAnswer: 1
        },
        {
          question: "Femeie de 35 ani cu durere pelvină, amenoree de 6 săptămâni și test de sarcină pozitiv. Prezintă durere acută și hemoragie vaginală. Diagnostic?",
          options: ["Sarcină normală", "Sarcină ectopică", "Avort spontan", "Chisturi ovariene"],
          correctAnswer: 1
        }
      ]
    }
  };

  // Mock data for demonstration
  useEffect(() => {
    if (isOpen) {
      setUserRankings([
        {
          id: 1,
          name: "Dr. Maria Popescu",
          avatar: "👩‍⚕️",
          totalXP: 2450,
          stepProgress: 6,
          fspCases: 15,
          fachbegriffe: 120,
          grammar: 45,
          rank: 1,
          streak: 12,
          country: "🇷🇴"
        },
        {
          id: 2,
          name: "Dr. Alexandru Ionescu",
          avatar: "👨‍⚕️",
          totalXP: 2280,
          stepProgress: 5,
          fspCases: 18,
          fachbegriffe: 95,
          grammar: 38,
          rank: 2,
          streak: 8,
          country: "🇷🇴"
        },
        {
          id: 3,
          name: "Dr. Elena Cristea",
          avatar: "👩‍⚕️",
          totalXP: 2150,
          stepProgress: 5,
          fspCases: 12,
          fachbegriffe: 110,
          grammar: 52,
          rank: 3,
          streak: 15,
          country: "🇷🇴"
        },
        {
          id: 4,
          name: "Dr. Andrei Stoica",
          avatar: "👨‍⚕️",
          totalXP: 1980,
          stepProgress: 4,
          fspCases: 14,
          fachbegriffe: 88,
          grammar: 33,
          rank: 4,
          streak: 6,
          country: "🇷🇴"
        },
        {
          id: 5,
          name: "Tu",
          avatar: "🤓",
          totalXP: 1850,
          stepProgress: 4,
          fspCases: 10,
          fachbegriffe: 75,
          grammar: 28,
          rank: 5,
          streak: 4,
          country: "🇷🇴",
          isCurrentUser: true
        }
      ]);

      setCompetitions([
        {
          id: 1,
          title: "📚 Fachbegriffe Speed Challenge",
          description: "Cine răspunde mai repede la 10 termeni medicali aleatori",
          participants: 24,
          timeLimit: 60,
          reward: "150 XP + Badge Specialist",
          status: "active",
          endsIn: "2h 15min"
        },
        {
          id: 2,
          title: "🔍 Diagnostic Challenge",
          description: "Pune diagnosticul corect pentru 5 cazuri clinice",
          participants: 18,
          timeLimit: 300,
          reward: "200 XP + Badge Detectiv",
          status: "active",
          endsIn: "45min"
        },
        {
          id: 3,
          title: "📝 Prezentare de Caz",
          description: "Scrie cea mai corectă prezentare gramaticală",
          participants: 12,
          timeLimit: 600,
          reward: "250 XP + Badge Komunikator",
          status: "starting",
          startsIn: "1h 30min"
        }
      ]);
    }
  }, [isOpen]);

  const categories = [
    { id: 'total', name: 'Total XP', icon: Star },
    { id: 'steps', name: 'Step Progress', icon: Target },
    { id: 'fsp', name: 'FSP Cases', icon: Zap },
    { id: 'fachbegriffe', name: 'Fachbegriffe', icon: Medal },
    { id: 'grammar', name: 'Gramatică', icon: Award }
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getCategoryValue = (user, category) => {
    switch (category) {
      case 'total': return user.totalXP;
      case 'steps': return user.stepProgress;
      case 'fsp': return user.fspCases;
      case 'fachbegriffe': return user.fachbegriffe;
      case 'grammar': return user.grammar;
      default: return user.totalXP;
    }
  };

  const startCompetition = (competition) => {
    setActiveCompetition(competition);
    // Here would be the actual game logic
  };

  const startMiniGame = (gameType) => {
    setActiveMiniGame(gameType);
  };

  const handleMiniGameComplete = (result) => {
    // Award points using gamification manager
    const gameResult = gamificationManager.completeQuiz(result.totalQuestions, result.correctAnswers);
    
    // Update local user stats (this would normally sync with backend)
    setUserRankings(prev => prev.map(user => {
      if (user.isCurrentUser) {
        return {
          ...user,
          totalXP: user.totalXP + gameResult.points,
          fachbegriffe: activeMiniGame === 'fachbegriffe' ? user.fachbegriffe + result.correctAnswers : user.fachbegriffe
        };
      }
      return user;
    }));

    // Close the mini game
    setActiveMiniGame(null);
  };

  const handleMiniGameClose = () => {
    setActiveMiniGame(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Clasament & Competiții</h2>
                <p className="text-purple-200">Concurează cu alți medici români</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'leaderboard' 
                  ? 'bg-white text-purple-600 font-semibold' 
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              🏆 Clasament
            </button>
            <button
              onClick={() => setActiveTab('competitions')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'competitions' 
                  ? 'bg-white text-purple-600 font-semibold' 
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              🎮 Competiții
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'leaderboard' && (
            <div>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-100 text-purple-600 border-2 border-purple-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Leaderboard */}
              <div className="space-y-3">
                {userRankings
                  .sort((a, b) => getCategoryValue(b, selectedCategory) - getCategoryValue(a, selectedCategory))
                  .map((user, index) => (
                    <div 
                      key={user.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                        user.isCurrentUser 
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(index + 1)}
                      </div>
                      
                      <div className="text-2xl">{user.avatar}</div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${user.isCurrentUser ? 'text-blue-600' : 'text-gray-800'}`}>
                            {user.name}
                          </span>
                          <span>{user.country}</span>
                          {user.streak >= 7 && (
                            <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs">
                              <Clock className="h-3 w-3" />
                              {user.streak} zile
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Steps: {user.stepProgress}/6 • FSP: {user.fspCases} • Fach: {user.fachbegriffe}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">
                          {getCategoryValue(user, selectedCategory)}
                          {selectedCategory === 'total' && ' XP'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedCategory === 'total' ? 'Total Experience' : categories.find(c => c.id === selectedCategory)?.name}
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'competitions' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Competiții Active</h3>
                <p className="text-gray-600">Alătură-te provocărilor și câștigă XP bonus!</p>
              </div>

              <div className="grid gap-4">
                {competitions.map(competition => (
                  <div key={competition.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{competition.title}</h4>
                        <p className="text-gray-600 text-sm">{competition.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        competition.status === 'active' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {competition.status === 'active' ? 'ACTIV' : 'ÎNCEPE CURÂND'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>{competition.participants} participanți</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>{competition.timeLimit}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>{competition.reward}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-purple-500" />
                        <span>
                          {competition.status === 'active' ? competition.endsIn : competition.startsIn}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startCompetition(competition)}
                        disabled={competition.status !== 'active'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                          competition.status === 'active'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Play className="h-4 w-4" />
                        {competition.status === 'active' ? 'Participă' : 'Așteptare'}
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        Detalii
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini Games Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Mini Jocuri Rapide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">⚡</div>
                      <div>
                        <h4 className="font-semibold">Fachbegriffe Flash</h4>
                        <p className="text-sm text-gray-600">Quiz rapid 30 secunde</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => startMiniGame('fachbegriffe')}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Joacă Acum
                    </button>
                  </div>

                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">🔍</div>
                      <div>
                        <h4 className="font-semibold">Diagnostic Express</h4>
                        <p className="text-sm text-gray-600">Ghicește diagnosticul</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => startMiniGame('diagnostic')}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Joacă Acum
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Competition Modal */}
        {activeCompetition && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">{activeCompetition.title}</h3>
              <p className="text-gray-600 mb-4">Competiția va începe în curând...</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveCompetition(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
                >
                  Anulează
                </button>
                <button 
                  onClick={() => setActiveCompetition(null)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                >
                  Începe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini Game Quiz Modal */}
      {activeMiniGame && (
        <InteractiveQuiz
          quizData={miniGamesData[activeMiniGame]}
          title={miniGamesData[activeMiniGame].title}
          onComplete={handleMiniGameComplete}
          onClose={handleMiniGameClose}
        />
      )}
    </div>
  );
};

export default LeaderboardModal;