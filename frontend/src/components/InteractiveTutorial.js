import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Play } from 'lucide-react';

const InteractiveTutorial = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const tutorialSteps = [
    {
      title: 'Bine ai venit la ApprobMed!',
      content: 'Te vom ghida prin toate funcționalitățile aplicației pentru a obține Approbation în Germania.',
      target: null,
      position: 'center'
    },
    {
      title: 'Harta ta de progres',
      content: 'Aceasta este harta interactivă care îți arată progresul către Approbation. Fiecare pas reprezintă o etapă importantă.',
      target: '.journey-map, main',
      position: 'top'
    },
    {
      title: 'Pașii obligatorii',
      content: 'Acestea sunt cei 6 pași principali pe care trebuie să îi completezi pentru Approbation. Fă click pe orice pas pentru a vedea detaliile.',
      target: '.step-node',
      position: 'bottom'
    },
    {
      title: 'Funcții bonus',
      content: 'Nodurile portocalii sunt funcții suplimentare care te ajută: tutorul AI pentru FSP, generatorul de email-uri, informații utile și clasamentul.',
      target: '.bonus-node',
      position: 'top'
    },
    {
      title: 'Dosarul personal',
      content: 'Aici poți să îți organizezi toate documentele necesare pentru Approbation. Adaugă notițe, link-uri și încarcă fișiere.',
      target: '[title="Dosarul Meu Personal"]',
      position: 'left'
    },
    {
      title: 'Setări cont',
      content: 'Din setări poți să îți modifici profilul, să schimbi parola și să gestionezi preferințele de notificare.',
      target: '[title="Setări"]',
      position: 'left'
    },
    {
      title: 'Informații utile',
      content: 'Aici găsești resurse valoroase: canale YouTube, grupuri de suport și site-uri oficiale pentru fiecare Bundesland.',
      target: null,
      position: 'center',
      action: 'infoHub'
    },
    {
      title: 'Tutorul FSP cu AI',
      content: 'Funcția premium care te ajută să exersezi germana medicală cu inteligența artificială. Perfect pentru pregătirea FSP!',
      target: null,
      position: 'center',
      isPremium: true
    },
    {
      title: 'Modul de progres',
      content: 'Poți alterna între modul "Progresiv" (pas cu pas) și "Liber" (acces la toți pașii). Recomandăm modul progresiv pentru începători.',
      target: '.fixed.bottom-4.right-4',
      position: 'top'
    },
    {
      title: 'Gata să începi!',
      content: 'Acum cunoști toate funcționalitățile de bază. Succes în obținerea Approbation-ului în Germania! 🎉',
      target: null,
      position: 'center'
    }
  ];

  const currentStepData = tutorialSteps[currentStep];

  useEffect(() => {
    if (isOpen && currentStepData.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.outline = '3px solid #3b82f6';
        element.style.outlineOffset = '2px';
        element.style.borderRadius = '8px';
        
        return () => {
          element.style.outline = '';
          element.style.outlineOffset = '';
          element.style.borderRadius = '';
        };
      }
    }
  }, [currentStep, isOpen, currentStepData.target]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tutorial_completed', 'true');
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial_skipped', 'true');
    onClose();
  };

  const getOverlayPosition = () => {
    if (!currentStepData.target) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const element = document.querySelector(currentStepData.target);
    if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const rect = element.getBoundingClientRect();
    const { position } = currentStepData;
    
    const overlayStyle = {};
    
    switch (position) {
      case 'top':
        overlayStyle.top = rect.top - 20;
        overlayStyle.left = rect.left + (rect.width / 2);
        overlayStyle.transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        overlayStyle.top = rect.bottom + 20;
        overlayStyle.left = rect.left + (rect.width / 2);
        overlayStyle.transform = 'translate(-50%, 0%)';
        break;
      case 'left':
        overlayStyle.top = rect.top + (rect.height / 2);
        overlayStyle.left = rect.left - 20;
        overlayStyle.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        overlayStyle.top = rect.top + (rect.height / 2);
        overlayStyle.left = rect.right + 20;
        overlayStyle.transform = 'translate(0%, -50%)';
        break;
      default:
        overlayStyle.top = '50%';
        overlayStyle.left = '50%';
        overlayStyle.transform = 'translate(-50%, -50%)';
    }
    
    return overlayStyle;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center">
      {/* Tutorial Overlay */}
      <div 
        className={`absolute bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 ${
          isAnimating ? 'scale-95 opacity-75' : 'scale-100 opacity-100'
        }`}
        style={getOverlayPosition()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
              {currentStep + 1} / {tutorialSteps.length}
            </span>
            {currentStepData.isPremium && (
              <span className="bg-purple-100 text-purple-600 text-xs font-medium px-2 py-1 rounded-full">
                Premium
              </span>
            )}
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Action Button */}
        {currentStepData.action === 'infoHub' && (
          <button
            onClick={() => {
              // This would trigger the InfoHub modal
              console.log('Opening InfoHub for tutorial');
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors mb-4 flex items-center justify-center gap-2"
          >
            <Play size={16} />
            Deschide Informații Utile
          </button>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={16} />
            Înapoi
          </button>

          <div className="flex space-x-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-blue-600 w-6' 
                    : index < currentStep 
                    ? 'bg-blue-300' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                <Check size={16} />
                Finalizează
              </>
            ) : (
              <>
                Următorul
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Skip option */}
        <div className="text-center mt-4">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sari peste tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTutorial;