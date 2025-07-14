import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Complete cleanup function
const cleanupTutorial = () => {
  // Remove all tutorial classes and styles
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

  // Find and highlight element - FIXED VERSION
  const findAndHighlightElement = useCallback((target) => {
    // Clear previous highlights first
    cleanupTutorial();
    
    if (!target) {
      setHighlightedElement(null);
      return;
    }

    let element = document.querySelector(target);
    
    // Enhanced fallback selectors
    if (!element) {
      if (target === '.step-node') {
        element = document.querySelector('.step-node-mobile') || 
                  document.querySelector('g.step-node') || 
                  document.querySelector('g.step-node-mobile') ||
                  document.querySelector('circle[class*="fill-blue-500"]') ||
                  document.querySelector('circle[class*="fill-green-500"]');
      } else if (target === '.bonus-node') {
        element = document.querySelector('.bonus-node-mobile') || 
                  document.querySelector('g.bonus-node') || 
                  document.querySelector('g.bonus-node-mobile') ||
                  document.querySelector('circle[class*="fill-orange-500"]');
      } else if (target === '.fixed.bottom-20') {
        element = document.querySelector('.progress-toggle-mobile') || 
                  document.querySelector('[class*="fixed"][class*="bottom"]') ||
                  document.querySelector('button[class*="toggle"]');
      }
    }

    if (element) {
      // Add highlight with MAXIMUM visibility
      element.classList.add('tutorial-highlight');
      
      // Force styles to ensure visibility
      element.style.position = 'relative';
      element.style.zIndex = '9999';
      element.style.outline = '4px solid #3b82f6';
      element.style.outlineOffset = '4px';
      element.style.borderRadius = '12px';
      element.style.boxShadow = '0 0 0 8px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.6)';
      element.style.animation = 'tutorialPulse 2s infinite';
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      
      // Scroll to element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Get element position for modal positioning
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
        bottom: rect.bottom + scrollTop,
        right: rect.right + scrollLeft,
      });
    } else {
      setHighlightedElement(null);
    }
  }, []);

  // Update highlight when step changes - FIXED VERSION
  useEffect(() => {
    if (isOpen && currentStepData) {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        findAndHighlightElement(currentStepData.target);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen, findAndHighlightElement, currentStepData]);

  // Setup tutorial styles - FIXED VERSION
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
          z-index: 9999 !important;
          outline: 4px solid #3b82f6 !important;
          outline-offset: 4px !important;
          border-radius: 12px !important;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.6) !important;
          animation: tutorialPulse 2s infinite !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        
        @keyframes tutorialPulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.03);
            opacity: 0.95;
          }
        }
        
        .tutorial-modal {
          z-index: 8000 !important;
          pointer-events: auto !important;
        }
        
        .tutorial-arrow {
          z-index: 8500 !important;
          pointer-events: none !important;
        }
        
        .tutorial-backdrop {
          z-index: 7000 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      cleanupTutorial();
    }
    
    return () => {
      cleanupTutorial();
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

  // Smart modal positioning to NEVER cover highlighted elements OR UI elements
  const getModalPosition = () => {
    const padding = 20;
    const modalWidth = 380;
    const modalHeight = 280;
    
    // Reserved space for right-side UI elements (chat, settings, etc.)
    const rightUISpace = 120;
    
    if (!highlightedElement) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${modalWidth}px`,
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate safe viewport dimensions (avoiding right UI elements)
    const safeViewportWidth = viewportWidth - rightUISpace;
    
    // Calculate available space around highlighted element
    const spaceTop = highlightedElement.top - padding;
    const spaceBottom = viewportHeight - highlightedElement.bottom - padding;
    const spaceLeft = highlightedElement.left - padding;
    const spaceRight = safeViewportWidth - highlightedElement.right - padding;
    
    let modalStyle = {
      position: 'fixed',
      width: `${modalWidth}px`,
    };
    
    // Priority: left -> bottom -> top -> center
    if (spaceLeft >= modalWidth) {
      // Place to the left
      modalStyle.left = `${highlightedElement.left - modalWidth - 20}px`;
      modalStyle.top = `${Math.max(padding, Math.min(
        highlightedElement.centerY - modalHeight / 2,
        viewportHeight - modalHeight - padding
      ))}px`;
    } else if (spaceBottom >= modalHeight) {
      // Place below element
      modalStyle.top = `${highlightedElement.bottom + 20}px`;
      modalStyle.left = `${Math.max(padding, Math.min(
        highlightedElement.centerX - modalWidth / 2,
        safeViewportWidth - modalWidth - padding
      ))}px`;
    } else if (spaceTop >= modalHeight) {
      // Place above element
      modalStyle.top = `${highlightedElement.top - modalHeight - 20}px`;
      modalStyle.left = `${Math.max(padding, Math.min(
        highlightedElement.centerX - modalWidth / 2,
        safeViewportWidth - modalWidth - padding
      ))}px`;
    } else {
      // Fallback: center-left position (safe from right UI)
      modalStyle.left = `${Math.max(padding, (safeViewportWidth - modalWidth) / 2)}px`;
      modalStyle.top = `${Math.max(padding, (viewportHeight - modalHeight) / 2)}px`;
    }
    
    return modalStyle;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Minimal backdrop - NO blur */}
      <div 
        className="tutorial-backdrop fixed inset-0 bg-black/10"
        style={{ zIndex: 7000 }}
      />

      {/* Arrow pointing to highlighted element */}
      {highlightedElement && currentStepData.showArrow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="tutorial-arrow fixed"
          style={{
            top: highlightedElement.top - 60,
            left: highlightedElement.centerX - 20,
            zIndex: 8500,
            pointerEvents: 'none',
          }}
        >
          <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg animate-bounce">
            <ArrowDown size={24} />
          </div>
        </motion.div>
      )}

      {/* Tutorial Modal */}
      <div
        className="tutorial-modal bg-white rounded-xl shadow-2xl p-6"
        style={{ ...getModalPosition(), zIndex: 8000, pointerEvents: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
            {currentStep + 1} / {tutorialSteps.length}
          </span>
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
      </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
            {currentStep + 1} / {tutorialSteps.length}
          </span>
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
      </div>
    </AnimatePresence>
  );
};

export default InteractiveTutorial;