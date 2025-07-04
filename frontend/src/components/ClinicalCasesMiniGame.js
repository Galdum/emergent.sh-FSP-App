import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Trophy, Star, RefreshCw, ChevronRight, Stethoscope, Heart, Brain, AlertCircle } from 'lucide-react';

/**
 * Clinical Cases Mini-Game Component
 * Interactive medical scenarios in German for FSP preparation
 */
export const ClinicalCasesMiniGame = ({ 
  onComplete, 
  onClose, 
  title = "Klinische Fälle - Mini-Spiel" 
}) => {
  const [currentCase, setCurrentCase] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('anamnese'); // anamnese, diagnosis, therapy
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [patientResponse, setPatientResponse] = useState('');

  // Timer effect
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      finishGame();
    }
  }, [timeLeft, gameStarted, showResults]);

  const clinicalCases = [
    {
      id: 'case_1',
      title: 'Akute Dyspnoe',
      patientInfo: {
        name: 'Herr Müller',
        age: 68,
        gender: 'männlich',
        chief_complaint: 'Atemnot seit 2 Stunden'
      },
      phases: {
        anamnese: {
          question: 'Führen Sie eine gezielte Anamnese durch. Was fragen Sie den Patienten?',
          options: [
            'Haben Sie Schmerzen in der Brust?',
            'Wann haben Sie das letzte Mal gegessen?',
            'Nehmen Sie regelmäßig Medikamente ein?',
            'Hatten Sie schon einmal ähnliche Beschwerden?'
          ],
          correct: [0, 2, 3],
          patientResponses: {
            0: 'Ja, ich habe drückende Schmerzen hinter dem Brustbein, die bis in den linken Arm ausstrahlen.',
            2: 'Ich nehme täglich Ramipril 5mg und Metformin 500mg.',
            3: 'Vor einem Jahr hatte ich einen Herzinfarkt. Seitdem war ich eigentlich beschwerdefrei.'
          }
        },
        diagnosis: {
          question: 'Aufgrund der Anamnese: Welche Verdachtsdiagnose stellen Sie?',
          options: [
            'Akutes Koronarsyndrom',
            'Lungenembolie',
            'Pneumothorax',
            'Asthma bronchiale'
          ],
          correct: [0],
          explanation: 'Die Kombination aus Dyspnoe, retrosternalen Schmerzen mit Ausstrahlung und der Anamnese eines früheren Herzinfarkts sprechen für ein akutes Koronarsyndrom.'
        },
        therapy: {
          question: 'Welche Sofortmaßnahmen leiten Sie ein?',
          options: [
            'O2-Gabe über Nasensonde',
            'EKG schreiben',
            'Venöser Zugang und Blutentnahme',
            'Alle genannten Maßnahmen'
          ],
          correct: [3],
          explanation: 'Bei Verdacht auf akutes Koronarsyndrom sind alle genannten Maßnahmen indiziert: O2-Gabe, EKG-Diagnostik und Labordiagnostik.'
        }
      }
    },
    {
      id: 'case_2',
      title: 'Akute Bauchschmerzen',
      patientInfo: {
        name: 'Frau Schmidt',
        age: 35,
        gender: 'weiblich',
        chief_complaint: 'Starke Bauchschmerzen seit 6 Stunden'
      },
      phases: {
        anamnese: {
          question: 'Die Patientin klagt über starke Bauchschmerzen. Was fragen Sie?',
          options: [
            'Wo genau sind die Schmerzen lokalisiert?',
            'Haben Sie Fieber?',
            'Wann war Ihre letzte Menstruation?',
            'Haben Sie erbrochen?'
          ],
          correct: [0, 1, 2, 3],
          patientResponses: {
            0: 'Die Schmerzen sind im rechten Unterbauch, etwa hier (zeigt auf McBurney-Punkt).',
            1: 'Ja, ich habe seit heute Morgen erhöhte Temperatur, etwa 38,5°C.',
            2: 'Meine letzte Periode war vor 3 Wochen, ganz normal.',
            3: 'Ja, ich habe zweimal erbrochen, aber nur Flüssigkeit.'
          }
        },
        diagnosis: {
          question: 'Welche Verdachtsdiagnose ist am wahrscheinlichsten?',
          options: [
            'Appendizitis',
            'Extrauteringravidität',
            'Ovarialzyste',
            'Gastroenteritis'
          ],
          correct: [0],
          explanation: 'Schmerzen im rechten Unterbauch (McBurney-Punkt), Fieber und Erbrechen sind klassische Zeichen einer Appendizitis.'
        },
        therapy: {
          question: 'Welche diagnostischen Schritte sind erforderlich?',
          options: [
            'Ultraschall Abdomen',
            'Labordiagnostik (CRP, Leukozyten)',
            'Schwangerschaftstest',
            'Alle genannten Untersuchungen'
          ],
          correct: [3],
          explanation: 'Alle Untersuchungen sind bei einer Frau im gebärfähigen Alter mit akuten Bauchschmerzen indiziert.'
        }
      }
    },
    {
      id: 'case_3',
      title: 'Akute Bewusstseinseintrübung',
      patientInfo: {
        name: 'Herr Weber',
        age: 72,
        gender: 'männlich',
        chief_complaint: 'Verwirrtheit seit heute Morgen'
      },
      phases: {
        anamnese: {
          question: 'Der Patient ist verwirrt. Was fragen Sie die Angehörigen?',
          options: [
            'Seit wann ist er verwirrt?',
            'Nimmt er Medikamente ein?',
            'Hatte er Fieber?',
            'Ist er gestürzt?'
          ],
          correct: [0, 1, 2, 3],
          patientResponses: {
            0: 'Seit heute Morgen ist er ganz durcheinander, erkennt uns nicht richtig.',
            1: 'Er nimmt Marcumar und Digoxin. Gestern hat er seine Wassertablette doppelt genommen.',
            2: 'Nein, Fieber hatte er nicht.',
            3: 'Nein, er ist nicht gestürzt.'
          }
        },
        diagnosis: {
          question: 'Was ist die wahrscheinlichste Ursache?',
          options: [
            'Schlaganfall',
            'Elektrolytstörung durch Diuretika',
            'Harnwegsinfekt',
            'Digitalisintoxikation'
          ],
          correct: [1],
          explanation: 'Die doppelte Einnahme von Diuretika kann zu Elektrolytstörungen führen, die akute Verwirrtheit auslösen können.'
        },
        therapy: {
          question: 'Welche Laborparameter prüfen Sie prioritär?',
          options: [
            'Natrium, Kalium',
            'Kreatinin, Harnstoff',
            'Blutzucker',
            'Alle genannten Parameter'
          ],
          correct: [3],
          explanation: 'Bei Verwirrtheit nach Diuretika-Überdosierung sind alle Parameter relevant: Elektrolyte, Nierenwerte und Blutzucker.'
        }
      }
    }
  ];

  const startGame = () => {
    setGameStarted(true);
  };

  const handleAnswer = (answer) => {
    const caseId = clinicalCases[currentCase].id;
    const phase = currentPhase;
    
    setAnswers(prev => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        [phase]: answer
      }
    }));

    // Show patient response if applicable
    const currentCaseData = clinicalCases[currentCase];
    if (phase === 'anamnese' && currentCaseData.phases[phase].patientResponses) {
      if (Array.isArray(answer)) {
        const responses = answer.map(answerIndex => 
          currentCaseData.phases[phase].patientResponses[answerIndex]
        ).filter(Boolean);
        setPatientResponse(responses.join(' '));
      } else if (currentCaseData.phases[phase].patientResponses[answer]) {
        setPatientResponse(currentCaseData.phases[phase].patientResponses[answer]);
      }
    }
  };

  const nextPhase = () => {
    if (currentPhase === 'anamnese') {
      setCurrentPhase('diagnosis');
      setPatientResponse('');
    } else if (currentPhase === 'diagnosis') {
      setCurrentPhase('therapy');
    } else {
      // Move to next case or finish
      if (currentCase < clinicalCases.length - 1) {
        setCurrentCase(currentCase + 1);
        setCurrentPhase('anamnese');
        setPatientResponse('');
      } else {
        finishGame();
      }
    }
  };

  const finishGame = () => {
    let totalScore = 0;
    let totalQuestions = 0;
    
    clinicalCases.forEach((clinicalCase, caseIndex) => {
      Object.keys(clinicalCase.phases).forEach(phase => {
        totalQuestions++;
        const userAnswer = answers[clinicalCase.id]?.[phase];
        const correctAnswer = clinicalCase.phases[phase].correct;
        
        if (Array.isArray(correctAnswer)) {
          // Multiple correct answers
          if (Array.isArray(userAnswer)) {
            const correctCount = userAnswer.filter(ans => correctAnswer.includes(ans)).length;
            const incorrectCount = userAnswer.filter(ans => !correctAnswer.includes(ans)).length;
            const score = Math.max(0, correctCount - incorrectCount);
            totalScore += score / correctAnswer.length;
          }
        } else {
          // Single correct answer
          if (userAnswer === correctAnswer[0]) {
            totalScore++;
          }
        }
      });
    });
    
    const finalScore = Math.round((totalScore / totalQuestions) * 100);
    setScore(finalScore);
    setShowResults(true);
    
    if (onComplete) {
      onComplete({
        score: finalScore,
        totalCases: clinicalCases.length,
        timeSpent: 900 - timeLeft
      });
    }
  };

  const restartGame = () => {
    setCurrentCase(0);
    setCurrentPhase('anamnese');
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setGameStarted(false);
    setTimeLeft(900);
    setPatientResponse('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'anamnese': return <Stethoscope className="h-5 w-5" />;
      case 'diagnosis': return <Brain className="h-5 w-5" />;
      case 'therapy': return <Heart className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getPhaseTitle = (phase) => {
    switch (phase) {
      case 'anamnese': return 'Anamnese';
      case 'diagnosis': return 'Diagnose';
      case 'therapy': return 'Therapie';
      default: return phase;
    }
  };

  // Game start screen
  if (!gameStarted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
          <div className="mb-6">
            <Stethoscope className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600">Interaktive klinische Fälle für die FSP-Vorbereitung</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Fälle:</span> {clinicalCases.length}
              </div>
              <div>
                <span className="font-semibold">Zeit:</span> 15 Minuten
              </div>
              <div>
                <span className="font-semibold">Phasen:</span> Anamnese → Diagnose → Therapie
              </div>
              <div>
                <span className="font-semibold">Sprache:</span> Deutsch
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Stethoscope className="h-5 w-5" />
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
              <Star className="h-20 w-20 text-blue-500 mx-auto mb-4" />
            ) : (
              <RefreshCw className="h-20 w-20 text-gray-500 mx-auto mb-4" />
            )}
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Spiel beendet!</h2>
            <p className={`text-4xl font-bold mb-2 ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {score}%
            </p>
            <p className="text-gray-600 mb-4">
              {score >= 90 ? '🏆 Excellent! Sie sind bereit für die FSP!' : 
               score >= 70 ? '👍 Gut! Weiter so!' : 
               '📚 Mehr Übung nötig!'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Bearbeitete Fälle:</span> {clinicalCases.length}
              </div>
              <div>
                <span className="font-semibold">Ergebnis:</span> {score}%
              </div>
              <div>
                <span className="font-semibold">Zeit benötigt:</span> {formatTime(900 - timeLeft)}
              </div>
              <div>
                <span className="font-semibold">Verbesserung:</span> {score < 70 ? 'Anamnese üben' : 'Sehr gut!'}
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
  const currentCaseData = clinicalCases[currentCase];
  const currentPhaseData = currentCaseData.phases[currentPhase];
  const progress = ((currentCase * 3 + ['anamnese', 'diagnosis', 'therapy'].indexOf(currentPhase) + 1) / (clinicalCases.length * 3)) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{currentCaseData.title}</h2>
            <p className="text-gray-600">
              Fall {currentCase + 1}/{clinicalCases.length} - {getPhaseTitle(currentPhase)}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Patient Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            {getPhaseIcon(currentPhase)}
            <h3 className="font-semibold text-blue-800">Patient: {currentCaseData.patientInfo.name}</h3>
          </div>
          <p className="text-sm text-blue-700">
            {currentCaseData.patientInfo.age} Jahre, {currentCaseData.patientInfo.gender}
          </p>
          <p className="text-sm text-blue-700 font-medium">
            Hauptbeschwerde: {currentCaseData.patientInfo.chief_complaint}
          </p>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{currentPhaseData.question}</h3>
          
          <div className="space-y-3">
            {currentPhaseData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentPhase === 'anamnese' ? 
                  (answers[currentCaseData.id]?.[currentPhase] || []).includes(index) ?
                    (answers[currentCaseData.id]?.[currentPhase] || []).filter(i => i !== index) :
                    [...(answers[currentCaseData.id]?.[currentPhase] || []), index]
                  : index
                )}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                  (currentPhase === 'anamnese' ? 
                    (answers[currentCaseData.id]?.[currentPhase] || []).includes(index) :
                    answers[currentCaseData.id]?.[currentPhase] === index
                  ) ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    (currentPhase === 'anamnese' ? 
                      (answers[currentCaseData.id]?.[currentPhase] || []).includes(index) :
                      answers[currentCaseData.id]?.[currentPhase] === index
                    ) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {(currentPhase === 'anamnese' ? 
                      (answers[currentCaseData.id]?.[currentPhase] || []).includes(index) :
                      answers[currentCaseData.id]?.[currentPhase] === index
                    ) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Response */}
        {patientResponse && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-2">Antwort des Patienten:</h4>
            <p className="text-green-700">{patientResponse}</p>
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
          
          <button
            onClick={nextPhase}
            disabled={!answers[currentCaseData.id]?.[currentPhase]}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {currentPhase === 'therapy' && currentCase === clinicalCases.length - 1 ? 'Beenden' : 'Weiter'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalCasesMiniGame;