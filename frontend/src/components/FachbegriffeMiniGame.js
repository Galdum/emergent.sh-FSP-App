import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Trophy, Star, RefreshCw, ChevronRight, BookOpen, Target, Zap, Brain } from 'lucide-react';

/**
 * Fachbegriffe Mini-Game Component
 * Translates medical technical terms (Fachsprache) to everyday language (Umgangssprache)
 * Game modes: Multiple Choice, Speed Round, Match Terms
 */
export const FachbegriffeMiniGame = ({ 
  onComplete, 
  onClose, 
  gameMode = 'multiple_choice', // multiple_choice, speed_round, match_terms
  title = "Fachbegriffe - Mini-Spiel" 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedMode, setSelectedMode] = useState(gameMode);
  const [streak, setStreak] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  // Timer effect
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      finishGame();
    }
  }, [timeLeft, gameStarted, showResults]);

  const fachbegriffe = [
    {
      category: 'Anatomie',
      terms: [
        {
          fachsprache: 'Myokardinfarkt',
          umgangssprache: 'Herzinfarkt',
          options: ['Herzinfarkt', 'Herzrhythmusstörung', 'Herzinsuffizienz', 'Herzklappendefekt'],
          explanation: 'Der Myokardinfarkt ist der medizinische Fachbegriff für den umgangssprachlichen Herzinfarkt - das Absterben von Herzmuskelgewebe.'
        },
        {
          fachsprache: 'Zephalalgie',
          umgangssprache: 'Kopfschmerzen',
          options: ['Kopfschmerzen', 'Schwindel', 'Migräne', 'Nackenschmerzen'],
          explanation: 'Zephalalgie ist der medizinische Fachausdruck für Kopfschmerzen jeder Art.'
        },
        {
          fachsprache: 'Dyspnoe',
          umgangssprache: 'Atemnot',
          options: ['Atemnot', 'Husten', 'Brustschmerzen', 'Herzrasen'],
          explanation: 'Dyspnoe bezeichnet medizinisch die subjektiv empfundene Atemnot oder Luftnot.'
        },
        {
          fachsprache: 'Hypertonie',
          umgangssprache: 'Bluthochdruck',
          options: ['Bluthochdruck', 'Herzrasen', 'Schwindel', 'Kopfschmerzen'],
          explanation: 'Hypertonie ist der medizinische Fachbegriff für erhöhten Blutdruck.'
        },
        {
          fachsprache: 'Gastralgie',
          umgangssprache: 'Magenschmerzen',
          options: ['Magenschmerzen', 'Übelkeit', 'Sodbrennen', 'Völlegefühl'],
          explanation: 'Gastralgie bezeichnet medizinisch Schmerzen im Magen.'
        }
      ]
    },
    {
      category: 'Symptome',
      terms: [
        {
          fachsprache: 'Emesis',
          umgangssprache: 'Erbrechen',
          options: ['Erbrechen', 'Übelkeit', 'Durchfall', 'Bauchschmerzen'],
          explanation: 'Emesis ist der medizinische Fachausdruck für Erbrechen.'
        },
        {
          fachsprache: 'Diarrhoe',
          umgangssprache: 'Durchfall',
          options: ['Durchfall', 'Verstopfung', 'Bauchschmerzen', 'Blähungen'],
          explanation: 'Diarrhoe ist die medizinische Bezeichnung für Durchfall.'
        },
        {
          fachsprache: 'Pyrexie',
          umgangssprache: 'Fieber',
          options: ['Fieber', 'Schüttelfrost', 'Schweißausbruch', 'Schwäche'],
          explanation: 'Pyrexie ist der medizinische Fachbegriff für erhöhte Körpertemperatur (Fieber).'
        },
        {
          fachsprache: 'Pruritus',
          umgangssprache: 'Juckreiz',
          options: ['Juckreiz', 'Hautausschlag', 'Brennen', 'Taubheit'],
          explanation: 'Pruritus bezeichnet medizinisch den Juckreiz der Haut.'
        },
        {
          fachsprache: 'Vertigo',
          umgangssprache: 'Schwindel',
          options: ['Schwindel', 'Kopfschmerzen', 'Übelkeit', 'Gleichgewichtsstörung'],
          explanation: 'Vertigo ist der medizinische Fachausdruck für Schwindel.'
        }
      ]
    },
    {
      category: 'Diagnostik',
      terms: [
        {
          fachsprache: 'Palpation',
          umgangssprache: 'Abtasten',
          options: ['Abtasten', 'Abhorchen', 'Abklopfen', 'Betrachten'],
          explanation: 'Palpation bedeutet die Untersuchung durch Abtasten mit den Händen.'
        },
        {
          fachsprache: 'Auskultation',
          umgangssprache: 'Abhören',
          options: ['Abhören', 'Abtasten', 'Abklopfen', 'Betrachten'],
          explanation: 'Auskultation ist das medizinische Abhören von Körpergeräuschen mit dem Stethoskop.'
        },
        {
          fachsprache: 'Perkussion',
          umgangssprache: 'Abklopfen',
          options: ['Abklopfen', 'Abtasten', 'Abhören', 'Betrachten'],
          explanation: 'Perkussion bedeutet das diagnostische Abklopfen des Körpers zur Untersuchung.'
        },
        {
          fachsprache: 'Inspektion',
          umgangssprache: 'Betrachten',
          options: ['Betrachten', 'Abtasten', 'Abhören', 'Abklopfen'],
          explanation: 'Inspektion ist die visuelle Betrachtung des Patienten oder Körperteils.'
        },
        {
          fachsprache: 'Sonographie',
          umgangssprache: 'Ultraschall',
          options: ['Ultraschall', 'Röntgen', 'CT-Scan', 'MRT'],
          explanation: 'Sonographie ist die medizinische Bezeichnung für Ultraschalluntersuchung.'
        }
      ]
    },
    {
      category: 'Therapie',
      terms: [
        {
          fachsprache: 'Analgetikum',
          umgangssprache: 'Schmerzmittel',
          options: ['Schmerzmittel', 'Beruhigungsmittel', 'Schlafmittel', 'Fiebermittel'],
          explanation: 'Analgetikum ist der medizinische Fachausdruck für Schmerzmittel.'
        },
        {
          fachsprache: 'Antibiotikum',
          umgangssprache: 'Bakterienmittel',
          options: ['Bakterienmittel', 'Virenmittel', 'Pilzmittel', 'Schmerzmittel'],
          explanation: 'Antibiotikum ist ein Medikament gegen bakterielle Infektionen.'
        },
        {
          fachsprache: 'Antipyretikum',
          umgangssprache: 'Fiebermittel',
          options: ['Fiebermittel', 'Schmerzmittel', 'Beruhigungsmittel', 'Schlafmittel'],
          explanation: 'Antipyretikum ist der medizinische Begriff für fiebersenkende Medikamente.'
        },
        {
          fachsprache: 'Sedativum',
          umgangssprache: 'Beruhigungsmittel',
          options: ['Beruhigungsmittel', 'Schmerzmittel', 'Schlafmittel', 'Fiebermittel'],
          explanation: 'Sedativum ist der medizinische Fachausdruck für beruhigende Medikamente.'
        },
        {
          fachsprache: 'Injektion',
          umgangssprache: 'Spritze',
          options: ['Spritze', 'Tablette', 'Tropfen', 'Salbe'],
          explanation: 'Injektion ist die medizinische Bezeichnung für die Verabreichung per Spritze.'
        }
      ]
    }
  ];

  const getAllTerms = () => {
    return fachbegriffe.reduce((acc, category) => {
      return [...acc, ...category.terms];
    }, []);
  };

  const getRandomTerms = (count) => {
    const allTerms = getAllTerms();
    const shuffled = [...allTerms].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const [gameTerms, setGameTerms] = useState([]);

  const initializeGame = () => {
    let terms = [];
    switch (selectedMode) {
      case 'multiple_choice':
        terms = getRandomTerms(15);
        setTimeLeft(600); // 10 minutes
        break;
      case 'speed_round':
        terms = getRandomTerms(20);
        setTimeLeft(300); // 5 minutes
        break;
      case 'match_terms':
        terms = getRandomTerms(10);
        setTimeLeft(480); // 8 minutes
        break;
      default:
        terms = getRandomTerms(15);
    }
    setGameTerms(terms);
    setGameStarted(true);
  };

  const handleAnswer = (answer) => {
    const currentTerm = gameTerms[currentQuestion];
    const isCorrect = answer === currentTerm.umgangssprache;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: {
        answer,
        correct: isCorrect,
        term: currentTerm
      }
    }));

    if (isCorrect) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    if (selectedMode === 'multiple_choice') {
      setShowExplanation(true);
    } else {
      nextQuestion();
    }
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestion < gameTerms.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    let correctCount = 0;
    Object.values(answers).forEach(answer => {
      if (answer.correct) correctCount++;
    });
    
    const baseScore = Math.round((correctCount / gameTerms.length) * 100);
    let bonusScore = 0;
    
    // Bonus for speed
    if (selectedMode === 'speed_round') {
      const timeBonus = Math.round((timeLeft / 300) * 20);
      bonusScore += timeBonus;
    }
    
    // Bonus for streak
    if (streak >= 5) {
      bonusScore += 15;
    }
    
    const finalScore = Math.min(100, baseScore + bonusScore);
    setScore(finalScore);
    setShowResults(true);
    
    if (onComplete) {
      onComplete({
        score: finalScore,
        correctAnswers: correctCount,
        totalQuestions: gameTerms.length,
        gameMode: selectedMode,
        streak,
        timeSpent: selectedMode === 'speed_round' ? (300 - timeLeft) : (600 - timeLeft)
      });
    }
  };

  const restartGame = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setGameStarted(false);
    setStreak(0);
    setShowExplanation(false);
    setGameTerms([]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'multiple_choice': return <BookOpen className="h-5 w-5" />;
      case 'speed_round': return <Zap className="h-5 w-5" />;
      case 'match_terms': return <Target className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getModeTitle = (mode) => {
    switch (mode) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'speed_round': return 'Speed Round';
      case 'match_terms': return 'Begriffe Zuordnen';
      default: return mode;
    }
  };

  const getModeDescription = (mode) => {
    switch (mode) {
      case 'multiple_choice': return '15 Fragen mit Erklärungen';
      case 'speed_round': return '20 Fragen in 5 Minuten';
      case 'match_terms': return '10 Begriffspaare zuordnen';
      default: return '';
    }
  };

  // Game mode selection screen
  if (!gameStarted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
          <div className="mb-6">
            <BookOpen className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600">Fachsprache → Umgangssprache</p>
          </div>
          
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Spielmodus wählen:</h3>
            
            {['multiple_choice', 'speed_round', 'match_terms'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedMode === mode 
                    ? 'border-green-500 bg-green-50 text-green-800' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getModeIcon(mode)}
                  <div className="text-left">
                    <div className="font-semibold">{getModeTitle(mode)}</div>
                    <div className="text-sm text-gray-600">{getModeDescription(mode)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={initializeGame}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              {getModeIcon(selectedMode)}
              Spiel starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game results screen
  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
          <div className="mb-6">
            {score >= 90 ? (
              <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
            ) : score >= 70 ? (
              <Star className="h-20 w-20 text-green-500 mx-auto mb-4" />
            ) : (
              <RefreshCw className="h-20 w-20 text-gray-500 mx-auto mb-4" />
            )}
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Spiel beendet!</h2>
            <p className={`text-4xl font-bold mb-2 ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {score}%
            </p>
            <p className="text-gray-600 mb-4">
              {score >= 90 ? '🏆 Perfekt! Sie beherrschen die Fachbegriffe!' : 
               score >= 70 ? '👍 Gut gemacht! Weiter so!' : 
               '📚 Mehr Übung mit Fachbegriffen nötig!'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Richtige Antworten:</span> {Object.values(answers).filter(a => a.correct).length} / {gameTerms.length}
              </div>
              <div>
                <span className="font-semibold">Spielmodus:</span> {getModeTitle(selectedMode)}
              </div>
              <div>
                <span className="font-semibold">Längste Serie:</span> {Math.max(...Object.values(answers).map((_, i) => {
                  let streak = 0;
                  for (let j = i; j < Object.values(answers).length; j++) {
                    if (Object.values(answers)[j].correct) streak++;
                    else break;
                  }
                  return streak;
                }))}
              </div>
              <div>
                <span className="font-semibold">Zeit benötigt:</span> {formatTime(selectedMode === 'speed_round' ? (300 - timeLeft) : (600 - timeLeft))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Schließen
            </button>
            <button
              onClick={restartGame}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Nochmal spielen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game play screen
  const currentTerm = gameTerms[currentQuestion];
  const progress = ((currentQuestion + 1) / gameTerms.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{getModeTitle(selectedMode)}</h2>
            <p className="text-gray-600">
              Frage {currentQuestion + 1} von {gameTerms.length}
              {streak > 0 && (
                <span className="ml-2 text-green-600 font-semibold">
                  🔥 {streak} richtig in Folge!
                </span>
              )}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            selectedMode === 'speed_round' && timeLeft < 60 
              ? 'bg-red-100 text-red-600' 
              : 'bg-green-100 text-green-600'
          }`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <div className="bg-green-50 rounded-lg p-6 mb-6 text-center">
            <h3 className="text-sm font-semibold text-green-800 mb-2">Fachsprache:</h3>
            <p className="text-3xl font-bold text-green-900">{currentTerm.fachsprache}</p>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Wie heißt das in der Umgangssprache?
          </h3>
          
          <div className="space-y-3">
            {currentTerm.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                  showExplanation 
                    ? option === currentTerm.umgangssprache
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : answers[currentQuestion]?.answer === option
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    showExplanation
                      ? option === currentTerm.umgangssprache
                        ? 'border-green-500 bg-green-500'
                        : answers[currentQuestion]?.answer === option
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                      : 'border-gray-300'
                  }`}>
                    {showExplanation && option === currentTerm.umgangssprache && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                    {showExplanation && answers[currentQuestion]?.answer === option && option !== currentTerm.umgangssprache && (
                      <X className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2">Erklärung:</h4>
            <p className="text-blue-700">{currentTerm.explanation}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Spiel beenden
          </button>
          
          {showExplanation ? (
            <button
              onClick={nextQuestion}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              {currentQuestion === gameTerms.length - 1 ? 'Beenden' : 'Weiter'}
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <div className="text-sm text-gray-500">
              Antwort auswählen...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FachbegriffeMiniGame;