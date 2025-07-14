import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple cleanup function
const cleanupTutorial = () => {
  // Remove all tutorial styles
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight');
    el.style.cssText = '';
  });
  
  // Remove tutorial styles
  const tutorialStyle = document.getElementById('tutorial-styles');
  if (tutorialStyle) {
    tutorialStyle.remove();
  }
  
  document.body.classList.remove('tutorial-active');
};

const InteractiveTutorial = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState(null);

  const tutorialSteps = [
    {
      title: 'Bine ai venit la FSP Navigator! 👋',
      content: 'În următoarele secunde îți arătăm locurile cheie din aplicație pentru un start rapid.',
      target: null,
      showArrow: false,
    },
    {
      title: 'Manager Documente & Asistent AI',
      content: 'Încarcă rapid rapoarte, diplome și notițe în acest hub personal. Aici găsești și Asistentul AI care te ajută cu întrebări despre Approbation & FSP.',
      target: '[title="Dosarul Meu Personal"]',
      showArrow: true,
    },
    {
      title: 'Progres & Checklist',
      content: 'Urmărește aici fiecare pas finalizat şi ce mai ai de făcut. Fiecare nod albastru reprezintă un pas important în procesul de Approbation.',
      target: '.step-node',
      showArrow: false,
    },
    {
      title: 'Noduri Bonus cu Resurse',
      content: 'Nodurile portocalii conțin resurse bonus: Hub-ul de Informații, Generatorul de Email-uri și Recomandatorul de Landuri.',
      target: '.bonus-node',
      showArrow: false,
    },
    {
      title: 'Toggle Bar - Moduri de Navigare',
      content: 'Aici poți comuta între modul Progresiv (pas cu pas) și modul Liber (acces la toate nodurile).',
      target: '.fixed.bottom-20',
      showArrow: true,
    },
    {
      title: 'Setări și Informații Personale',
      content: 'În Setări poți actualiza informațiile personale, schimba parola, administra abonamentul și descărca datele tale.',
      target: '[title="Setări"]',
      showArrow: true,
    },
    {
      title: 'Totul pregătit!',
      content: 'Perfect! Acum știi unde să găsești toate funcționalitățile importante. Poţi relua tutorialul din meniul de setări oricând 🥳',
      target: null,
      showArrow: false,
    },
  ];

  const currentStepData = tutorialSteps[currentStep];

  // Find and highlight element
  const findAndHighlightElement = useCallback((target) => {
    if (!target) {
      setHighlightedElement(null);
      return;
    }

    let element = document.querySelector(target);
    
    // Fallback selectors for step and bonus nodes
    if (!element && target === '.step-node') {
      element = document.querySelector('.step-node-mobile') || 
                document.querySelector('g.step-node') || 
                document.querySelector('circle[class*="fill-blue-500"]') ||
                document.querySelector('circle[class*="fill-green-500"]');
    }
    
    if (!element && target === '.bonus-node') {
      element = document.querySelector('.bonus-node-mobile') || 
                document.querySelector('g.bonus-node') || 
                document.querySelector('circle[class*="fill-orange-500"]');
    }

    if (!element && target === '.fixed.bottom-20') {
      element = document.querySelector('.progress-toggle-mobile') || 
                document.querySelector('[class*="fixed"][class*="bottom"]');
    }

    if (element) {
      // Clear previous highlights
      cleanupTutorial();
      
      // Add highlight
      element.classList.add('tutorial-highlight');
      
      // Scroll to element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Get element position for arrow
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setHighlightedElement({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + scrollLeft + rect.width / 2,
        centerY: rect.top + scrollTop + rect.height / 2,
      });
    } else {
      setHighlightedElement(null);
    }
  }, []);

  // Update highlight when step changes
  useEffect(() => {
    if (isOpen) {
      findAndHighlightElement(currentStepData.target);
    }
  }, [currentStep, isOpen, findAndHighlightElement, currentStepData.target]);

  // Setup tutorial styles
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('tutorial-active');
      
      // Add tutorial styles
      const style = document.createElement('style');
      style.id = 'tutorial-styles';
      style.textContent = `
        .tutorial-active {
          overflow: hidden;
        }
        
        .tutorial-highlight {
          position: relative !important;
          z-index: 1000 !important;
          outline: 4px solid #3b82f6 !important;
          outline-offset: 4px !important;
          border-radius: 8px !important;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5) !important;
          animation: tutorialPulse 2s infinite !important;
        }
        
        @keyframes tutorialPulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.02);
            opacity: 0.95;
          }
        }
        
        .tutorial-modal {
          z-index: 1100 !important;
        }
        
        .tutorial-arrow {
          z-index: 1050 !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      cleanupTutorial();
    }
    
    return () => {
      if (!isOpen) {
        cleanupTutorial();
      }
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    cleanupTutorial();
    localStorage.setItem('tutorialViewed', 'true');
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    cleanupTutorial();
    localStorage.setItem('tutorialViewed', 'true');
    onClose();
  };

  // Get modal position
  const getModalPosition = () => {
    const padding = 20;
    const modalWidth = 400;
    
    if (!highlightedElement) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${modalWidth}px`,
      };
    }

    // Position modal to not overlap with highlighted element
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = highlightedElement.top - 350;
    let left = highlightedElement.centerX - modalWidth / 2;
    
    // Adjust if modal goes outside viewport
    if (top < padding) {
      top = highlightedElement.top + highlightedElement.height + 20;
    }
    if (left < padding) {
      left = padding;
    }
    if (left + modalWidth > viewportWidth - padding) {
      left = viewportWidth - modalWidth - padding;
    }
    if (top + 300 > viewportHeight - padding) {
      top = viewportHeight - 300 - padding;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${modalWidth}px`,
    };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
      >
        {/* Enhanced spotlight effect */}
        <TutorialSpotlight 
          elementPosition={elementPosition} 
          isVisible={currentStepData.showSpotlight && !!elementPosition}
          currentStep={currentStep}
        />
        
        {/* Enhanced floating arrow */}
        <TutorialArrow 
          elementPosition={elementPosition} 
          position={currentStepData.position}
          isVisible={currentStepData.showSpotlight && !!elementPosition}
          stepData={currentStepData}
        />
        
        <motion.div
          key={currentStep}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-xl shadow-2xl p-6 tutorial-modal-responsive"
          style={getModalPosition()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                {currentStep + 1} / {tutorialSteps.length}
              </span>
              {getArrowComponent() && (
                <div className="ml-2">
                  {getArrowComponent()}
                </div>
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