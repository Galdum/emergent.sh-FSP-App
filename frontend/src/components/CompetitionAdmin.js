import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Settings } from 'lucide-react';

/**
 * Competition Admin Interface
 * Allows admins to manage competition questions and configurations
 */
export const CompetitionAdmin = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('questions');
  const [selectedQuiz, setSelectedQuiz] = useState('fachbegriffe');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  const quizTypes = [
    { id: 'fachbegriffe', name: 'Fachbegriffe Flash', icon: '⚡' },
    { id: 'diagnostic', name: 'Diagnostic Express', icon: '🔍' },
    { id: 'grammar', name: 'Gramatică Germană', icon: '📝' }
  ];

  const handleAddQuestion = () => {
    // In a real app, this would save to the backend
    console.log('Adding question:', newQuestion);
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion({ ...question, index });
  };

  const handleSaveQuestion = () => {
    // In a real app, this would save to the backend
    console.log('Saving question:', editingQuestion);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (index) => {
    // In a real app, this would delete from the backend
    console.log('Deleting question at index:', index);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Administrare Competiții</h2>
                <p className="text-purple-200">Gestionează întrebările și configurațiile</p>
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
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'questions' 
                  ? 'bg-white text-purple-600 font-semibold' 
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              📝 Întrebări
            </button>
            <button
              onClick={() => setActiveTab('competitions')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'competitions' 
                  ? 'bg-white text-purple-600 font-semibold' 
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              🏆 Competiții
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'stats' 
                  ? 'bg-white text-purple-600 font-semibold' 
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              📊 Statistici
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'questions' && (
            <div>
              {/* Quiz Type Selector */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Selectează Tipul de Quiz</h3>
                <div className="flex gap-3">
                  {quizTypes.map(quiz => (
                    <button
                      key={quiz.id}
                      onClick={() => setSelectedQuiz(quiz.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedQuiz === quiz.id
                          ? 'bg-purple-100 text-purple-600 border-2 border-purple-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xl">{quiz.icon}</span>
                      {quiz.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Question */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-3">Adaugă Întrebare Nouă</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Întrebarea</label>
                    <textarea
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      rows="2"
                      placeholder="Introdu întrebarea..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {newQuestion.options.map((option, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium mb-1">
                          Opțiunea {index + 1}
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={newQuestion.correctAnswer === index}
                            onChange={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                            className="ml-2"
                          />
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion({...newQuestion, options: newOptions});
                          }}
                          className="w-full p-2 border rounded-lg"
                          placeholder={`Opțiunea ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Explicație</label>
                    <input
                      type="text"
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Explicație pentru răspunsul corect..."
                    />
                  </div>
                  
                  <button
                    onClick={handleAddQuestion}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adaugă Întrebarea
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div>
                <h4 className="font-semibold mb-3">Întrebări Existente</h4>
                <div className="space-y-3">
                  {/* This would be populated from the actual questions data */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">Ce înseamnă 'Schmerzen' în română?</h5>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Opțiuni:</strong> Dureri, Febră, Greață, Amețeală</p>
                      <p><strong>Răspuns corect:</strong> Dureri</p>
                      <p><strong>Explicație:</strong> Schmerzen = Dureri în germană</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competitions' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Configurare Competiții</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 mb-4">
                  Pentru a modifica configurațiile competițiilor, editează fișierul{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded">frontend/src/data/competitionQuestions.js</code>
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Pași pentru adăugarea unei competiții noi:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Adaugă întrebările în secțiunea corespunzătoare din <code>competitionQuestions</code></li>
                    <li>Adaugă o nouă intrare în <code>competitionConfig.competitions</code></li>
                    <li>Asigură-te că <code>gameType</code> se potrivește cu cheia din <code>competitionQuestions</code></li>
                    <li>Setă <code>minScore</code> și <code>bonusPoints</code> pentru competiție</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Statistici Competiții</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800">Total Participanți</h4>
                  <p className="text-2xl font-bold text-blue-600">54</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800">Competiții Active</h4>
                  <p className="text-2xl font-bold text-green-600">2</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800">XP Acordat</h4>
                  <p className="text-2xl font-bold text-purple-600">1,250</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionAdmin;