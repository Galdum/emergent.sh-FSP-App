import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InteractiveTutorial = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const tutorialSteps = [
    {
      title: 'Bine ai venit la FSP Navigator! 👋',
      content: 'În următoarele secunde îți arătăm locurile cheie din aplicație pentru un start rapid.',
      target: null,
      position: 'center',
    },
    {
      title: 'Manager Documente',
      content: 'Încarcă rapid rapoarte, diplome și notițe în acest hub personal.',
      target: '[title="Dosarul Meu Personal"]',
      position: 'left',
    },
    {
      title: 'Asistent AI',
      content: 'Întreabă orice despre Approbation & FSP. Asistentul AI îți răspunde instant.',
      target: '.bonus-node',
      position: 'top',
    },
    {
      title: 'Progres & Checklist',
      content: 'Urmărește aici fiecare pas finalizat şi ce mai ai de făcut.',
      target: '.step-node',
      position: 'bottom',
    },
    {
      title: 'Totul pregătit!',
      content: 'Succes! Poţi relua tutorialul din meniu oricând 🥳',
      target: null,
      position: 'center',
    },
  ];

  const currentStepData = tutorialSteps[currentStep];

  useEffect(() => {
    if (isOpen && currentStepData.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('tutorial-ring');
        element.style.zIndex = 110;
        element.style.position = 'relative';

        return () => {
          element.classList.remove('tutorial-ring');
          element.style.zIndex = '';
          element.style.position = '';
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
    localStorage.setItem('tutorialViewed', 'true');
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('tutorialViewed', 'true');
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

  // Manage body scroll lock while tutorial is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center"
      >
        <motion.div
          key={currentStep}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
          style={getOverlayPosition()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                {currentStep + 1} / {tutorialSteps.length}
              </span>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InteractiveTutorial;