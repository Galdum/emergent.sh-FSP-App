import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Trophy, Star, RefreshCw, ChevronRight } from 'lucide-react';

/**
 * Interactive Quiz Component for Medical Licensing
 * Includes gamification features and multiple question types
 */
export const InteractiveQuiz = ({ 
  quizData, 
  onComplete, 
  onClose, 
  title = "Quiz Interactiv" 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  // Timer effect
  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      finishQuiz();
    }
  }, [timeLeft, quizStarted, showResults]);

  const startQuiz = () => {
    setQuizStarted(true);
    if (quizData.timeLimit) {
      setTimeLeft(quizData.timeLimit * 60); // Convert minutes to seconds
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    let correctCount = 0;
    quizData.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const finalScore = Math.round((correctCount / quizData.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    
    if (onComplete) {
      onComplete({
        score: finalScore,
        correctAnswers: correctCount,
        totalQuestions: quizData.questions.length,
        timeSpent: quizData.timeLimit ? (quizData.timeLimit * 60 - timeLeft) : null
      });
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setQuizStarted(false);
    if (quizData.timeLimit) {
      setTimeLeft(quizData.timeLimit * 60);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    if (score >= 90) return '🏆 Excelent! Ești pregătit pentru următorul nivel!';
    if (score >= 70) return '👍 Bun! Continuă să exersezi!';
    if (score >= 50) return '📚 Nu e rău! Mai studiază puțin!';
    return '💪 Keep trying! Practica face pe maestrul!';
  };

  // Quiz start screen
  if (!quizStarted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
          <div className="mb-6">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600">Testează-ți cunoștințele și câștigă puncte!</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Întrebări:</span> {quizData.questions.length}
              </div>
              <div>
                <span className="font-semibold">Timp:</span> {quizData.timeLimit ? `${quizData.timeLimit} min` : 'Nelimitat'}
              </div>
              <div>
                <span className="font-semibold">Puncte:</span> {quizData.questions.length * 20}
              </div>
              <div>
                <span className="font-semibold">Bonus:</span> +100 la scor perfect
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anulează
            </button>
            <button
              onClick={startQuiz}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Trophy className="h-5 w-5" />
              Începe Quiz-ul
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz results screen
  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
          <div className="mb-6">
            {score >= 90 ? (
              <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
            ) : score >= 70 ? (
              <Star className="h-20 w-20 text-blue-500 mx-auto mb-4" />
            ) : (
              <RefreshCw className="h-20 w-20 text-gray-500 mx-auto mb-4" />
            )}
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completat!</h2>
            <p className={`text-4xl font-bold mb-2 ${getScoreColor()}`}>{score}%</p>
            <p className="text-gray-600 mb-4">{getScoreMessage()}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Răspunsuri corecte:</span> {Object.keys(answers).reduce((acc, key) => {
                  return acc + (answers[key] === quizData.questions[key].correctAnswer ? 1 : 0);
                }, 0)} / {quizData.questions.length}
              </div>
              <div>
                <span className="font-semibold">Scor:</span> {score}%
              </div>
              {timeLeft !== null && (
                <div>
                  <span className="font-semibold">Timp folosit:</span> {formatTime((quizData.timeLimit * 60) - timeLeft)}
                </div>
              )}
              <div>
                <span className="font-semibold">Puncte câștigate:</span> {score === 100 ? (quizData.questions.length * 20 + 100) : Math.round(quizData.questions.length * 20 * (score / 100))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Închide
            </button>
            <button
              onClick={restartQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Reîncearcă
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz question screen
  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="text-gray-600">Întrebarea {currentQuestion + 1} din {quizData.questions.length}</p>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">{question.question}</h3>
          
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentQuestion, index)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                  answers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion] === index && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Ieși din Quiz
          </button>
          
          <button
            onClick={nextQuestion}
            disabled={answers[currentQuestion] === undefined}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {currentQuestion === quizData.questions.length - 1 ? 'Finalizează' : 'Următoarea'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Sample quiz data structure
export const sampleQuizzes = {
  fsp_basics: {
    title: "FSP - Cunoștințe de Bază",
    timeLimit: 15, // minutes
    questions: [
      {
        question: "Ce înseamnă FSP în contextul medical german?",
        options: [
          "Fachsprachprüfung (Examen de Limba Specializată)",
          "Facharztprüfung (Examen de Specialist)",
          "Fortbildungsprüfung (Examen de Perfecționare)",
          "Forschungsprüfung (Examen de Cercetare)"
        ],
        correctAnswer: 0
      },
      {
        question: "Care este structura examenului FSP?",
        options: [
          "Doar test scris",
          "Doar examen oral",
          "20 min. comunicare cu pacientul + 20 min. prezentare caz + 20 min. conversație cu medicul",
          "Test scris + examen oral"
        ],
        correctAnswer: 2
      },
      {
        question: "Ce nivel de germană este necesar pentru FSP?",
        options: [
          "A2",
          "B1",
          "B2",
          "C1"
        ],
        correctAnswer: 2
      },
      {
        question: "Unde se susține examenul FSP?",
        options: [
          "La universitate",
          "La Landesprüfungsamt",
          "La clinică",
          "Online"
        ],
        correctAnswer: 1
      },
      {
        question: "Ce se întâmplă dacă nu treci FSP-ul?",
        options: [
          "Nu mai poți da examenul",
          "Poți reface examenul după 3 luni",
          "Trebuie să aștepți 1 an",
          "Depinde de scorul obținut"
        ],
        correctAnswer: 1
      }
    ]
  },
  approbation_process: {
    title: "Procesul de Approbation",
    timeLimit: 10,
    questions: [
      {
        question: "Care este primul document necesar pentru Approbation?",
        options: [
          "Diploma de licență",
          "Certificatul de conformitate",
          "Cazierul judiciar",
          "Certificatul medical"
        ],
        correctAnswer: 1
      },
      {
        question: "Cât timp este valabil certificatul de conformitate?",
        options: [
          "6 luni",
          "1 an",
          "2 ani",
          "Nu expiră"
        ],
        correctAnswer: 2
      },
      {
        question: "Ce instituție eliberează Approbation-ul în Germania?",
        options: [
          "Bundesärztekammer",
          "Landesprüfungsamt",
          "Landesärztekammer",
          "Ministerul Sănătății"
        ],
        correctAnswer: 1
      }
    ]
  }
};

export default InteractiveQuiz;