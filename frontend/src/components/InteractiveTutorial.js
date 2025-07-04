import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InteractiveTutorial = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const tutorialSteps = [
    {
      title: 'Bine ai venit la FSP Navigator Enhanced! 🚀',
      content: 'În următoarele secunde îți arătăm funcționalitățile îmbunătățite ale aplicației pentru o experiență optimă.',
      target: null,
      position: 'center',
    },
    {
      title: 'Manager Documente Enhanced 📋',
      content: 'Încarcă rapid rapoarte, diplome și notițe în acest hub personal securizat cu backup cloud și organizare inteligentă.',
      target: '[title="Dosarul Meu Personal"]',
      position: 'left',
    },
    {
      title: 'Asistent AI Enhanced 🤖',
      content: 'Întreabă orice despre Approbation & FSP. Asistentul AI îmbunătățit îți răspunde instant cu tehnologie avansată.',
      target: '.bonus-node',
      position: 'top',
    },
    {
      title: 'Progres & Conformitate GDPR 🎯',
      content: 'Urmărește aici fiecare pas finalizat cu gamification și asigură-te de conformitatea GDPR completă.',
      target: '.step-node',
      position: 'bottom',
    },
    {
      title: 'Totul pregătit pentru Enhanced Experience! 🥳',
      content: 'Succes! Acum ai acces la toate funcționalitățile îmbunătățite. Poți relua tutorialul din meniu oricând.',
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
        element.classList.add('tutorial-ring-enhanced');
        element.style.zIndex = 110;
        element.style.position = 'relative';

        return () => {
          element.classList.remove('tutorial-ring-enhanced');
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
    localStorage.setItem('tutorialViewed', JSON.stringify({
      viewed: true,
      date: new Date().toISOString(),
      version: 'enhanced-v2.0'
    }));
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('tutorialViewed', JSON.stringify({
      viewed: true,
      skipped: true,
      date: new Date().toISOString(),
      version: 'enhanced-v2.0'
    }));
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
        className="fixed inset-0 z-[100] bg-gradient-to-br from-black/50 to-purple-900/50 backdrop-blur-sm flex items-center justify-center"
      >
        <motion.div
          key={currentStep}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
          className="absolute bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-blue-200"
          style={getOverlayPosition()}
        >
          {/* Enhanced Header with Gradient */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
              >
                Enhanced {currentStep + 1} / {tutorialSteps.length}
              </motion.div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Enhanced Content */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {currentStepData.content}
            </p>
          </motion.div>

          {/* Enhanced Navigation */}
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              Înapoi
            </motion.button>

            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    index === currentStep 
                      ? 'bg-gradient-to-r from-green-500 to-blue-600 w-8 shadow-lg' 
                      : index < currentStep 
                      ? 'bg-green-400 shadow-md' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  <Check size={16} />
                  Finalizează Enhanced
                </>
              ) : (
                <>
                  Următorul Enhanced
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </div>

          {/* Enhanced Skip option */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6"
          >
            <button
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors underline"
            >
              Sari peste tutorialul enhanced
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InteractiveTutorial;