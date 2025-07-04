import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check, ArrowDown, ArrowUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Spotlight component for highlighting elements
const TutorialSpotlight = ({ elementPosition, isVisible }) => {
  if (!isVisible || !elementPosition) return null;

  const spotlightStyle = {
    '--spotlight-x': `${elementPosition.centerX}px`,
    '--spotlight-y': `${elementPosition.centerY}px`,
    '--spotlight-radius': `${Math.max(elementPosition.width, elementPosition.height) / 2 + 20}px`,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="tutorial-spotlight"
      style={spotlightStyle}
    />
  );
};

const InteractiveTutorial = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [elementPosition, setElementPosition] = useState(null);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const tutorialSteps = [
    {
      title: 'Bine ai venit la FSP Navigator! 👋',
      content: 'În următoarele secunde îți arătăm locurile cheie din aplicație pentru un start rapid.',
      target: null,
      position: 'center',
      action: null,
      showSpotlight: false,
    },
    {
      title: 'Manager Documente',
      content: 'Încarcă rapid rapoarte, diplome și notițe în acest hub personal. Click pe iconul mov de sus-dreapta.',
      target: '[title="Dosarul Meu Personal"]',
      position: 'left',
      action: 'highlight_personal_files',
      showSpotlight: true,
    },
    {
      title: 'Asistent AI',
      content: 'Întreabă orice despre Approbation & FSP. Asistentul AI îți răspunde instant. Găsește-l în nodurile orange.',
      target: '.bonus-node',
      position: 'top',
      action: 'highlight_ai_assistant',
      showSpotlight: true,
    },
    {
      title: 'Progres & Checklist',
      content: 'Urmărește aici fiecare pas finalizat şi ce mai ai de făcut. Click pe oricare dintre nodurile albastre.',
      target: '.step-node',
      position: 'bottom',
      action: 'highlight_progress_steps',
      showSpotlight: true,
    },
    {
      title: 'Totul pregătit!',
      content: 'Succes! Poţi relua tutorialul din meniu oricând 🥳',
      target: null,
      position: 'center',
      action: null,
      showSpotlight: false,
    },
  ];

  const currentStepData = tutorialSteps[currentStep];

  // Update viewport size on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      // Recalculate element position on resize
      if (currentStepData.target) {
        updateElementPosition();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStepData.target]);

  // Enhanced element highlighting and interaction
  const handleStepAction = useCallback((action) => {
    if (!action) return;
    
    // Remove any existing highlights first
    document.querySelectorAll('.tutorial-highlight, .tutorial-ring').forEach(el => {
      el.classList.remove('tutorial-highlight', 'tutorial-ring');
    });

    switch (action) {
      case 'highlight_personal_files':
        const personalFileBtn = document.querySelector('[title="Dosarul Meu Personal"]');
        if (personalFileBtn) {
          personalFileBtn.classList.add('tutorial-highlight');
          personalFileBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add pulse effect
          personalFileBtn.style.animation = 'pulse 2s infinite';
        }
        break;
        
      case 'highlight_ai_assistant':
        const bonusNodes = document.querySelectorAll('.bonus-node');
        bonusNodes.forEach((node, index) => {
          node.classList.add('tutorial-highlight');
          // Stagger the animations
          setTimeout(() => {
            if (node.style) {
              node.style.animation = 'pulse 2s infinite';
            }
          }, index * 200);
        });
        if (bonusNodes.length > 0) {
          bonusNodes[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
        
      case 'highlight_progress_steps':
        const stepNodes = document.querySelectorAll('.step-node');
        stepNodes.forEach((node, index) => {
          node.classList.add('tutorial-highlight');
          // Stagger the animations
          setTimeout(() => {
            if (node.style) {
              node.style.animation = 'pulse 2s infinite';
            }
          }, index * 100);
        });
        if (stepNodes.length > 0) {
          stepNodes[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
    }
  }, []);

  // Calculate element position and update state
  const updateElementPosition = useCallback(() => {
    if (!currentStepData.target) {
      setElementPosition(null);
      return;
    }
    
    const element = document.querySelector(currentStepData.target);
    if (!element) {
      setElementPosition(null);
      return;
    }
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setElementPosition({
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + scrollLeft + rect.width / 2,
      centerY: rect.top + scrollTop + rect.height / 2,
    });
  }, [currentStepData.target]);

  useEffect(() => {
    if (isOpen && currentStepData.target) {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        updateElementPosition();
        handleStepAction(currentStepData.action);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // Clean up highlights when no target
      document.querySelectorAll('.tutorial-highlight, .tutorial-ring').forEach(el => {
        el.classList.remove('tutorial-highlight', 'tutorial-ring');
        if (el.style) {
          el.style.animation = '';
        }
      });
    }
  }, [currentStep, isOpen, currentStepData.target, currentStepData.action, updateElementPosition, handleStepAction]);

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
    // Clean up highlights and animations
    document.querySelectorAll('.tutorial-highlight, .tutorial-ring').forEach(el => {
      el.classList.remove('tutorial-highlight', 'tutorial-ring');
      if (el.style) {
        el.style.animation = '';
      }
    });
    
    localStorage.setItem('tutorialViewed', 'true');
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    // Clean up highlights and animations
    document.querySelectorAll('.tutorial-highlight, .tutorial-ring').forEach(el => {
      el.classList.remove('tutorial-highlight', 'tutorial-ring');
      if (el.style) {
        el.style.animation = '';
      }
    });
    
    localStorage.setItem('tutorialViewed', 'true');
    onClose();
  };

  const getModalPosition = () => {
    const padding = 20;
    const modalWidth = Math.min(384, viewportSize.width - padding * 2); // max-w-sm = 384px
    const modalHeight = 300; // approximate modal height
    
    if (!elementPosition || !currentStepData.target) {
      // Center positioning for steps without targets
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${modalWidth}px`,
        maxWidth: `calc(100vw - ${padding * 2}px)`,
      };
    }
    
    const { position } = currentStepData;
    let modalStyle = {
      position: 'fixed',
      width: `${modalWidth}px`,
      maxWidth: `calc(100vw - ${padding * 2}px)`,
    };
    
    switch (position) {
      case 'top':
        modalStyle.top = Math.max(padding, elementPosition.top - modalHeight - 20);
        modalStyle.left = Math.max(padding, Math.min(
          elementPosition.centerX - modalWidth / 2,
          viewportSize.width - modalWidth - padding
        ));
        break;
        
      case 'bottom':
        modalStyle.top = Math.min(
          viewportSize.height - modalHeight - padding,
          elementPosition.top + elementPosition.height + 20
        );
        modalStyle.left = Math.max(padding, Math.min(
          elementPosition.centerX - modalWidth / 2,
          viewportSize.width - modalWidth - padding
        ));
        break;
        
      case 'left':
        modalStyle.top = Math.max(padding, Math.min(
          elementPosition.centerY - modalHeight / 2,
          viewportSize.height - modalHeight - padding
        ));
        modalStyle.left = Math.max(padding, elementPosition.left - modalWidth - 20);
        // If no space on the left, put it on the right
        if (modalStyle.left < padding) {
          modalStyle.left = Math.min(
            elementPosition.left + elementPosition.width + 20,
            viewportSize.width - modalWidth - padding
          );
        }
        break;
        
      case 'right':
        modalStyle.top = Math.max(padding, Math.min(
          elementPosition.centerY - modalHeight / 2,
          viewportSize.height - modalHeight - padding
        ));
        modalStyle.left = Math.min(
          elementPosition.left + elementPosition.width + 20,
          viewportSize.width - modalWidth - padding
        );
        break;
        
      default:
        modalStyle.top = '50%';
        modalStyle.left = '50%';
        modalStyle.transform = 'translate(-50%, -50%)';
    }
    
    return modalStyle;
  };

  const getArrowComponent = () => {
    if (!elementPosition || !currentStepData.target) return null;
    
    const { position } = currentStepData;
    const arrowProps = { size: 24, className: "text-blue-600 animate-bounce" };
    
    switch (position) {
      case 'top': return <ArrowDown {...arrowProps} />;
      case 'bottom': return <ArrowUp {...arrowProps} />;
      case 'left': return <ArrowRight {...arrowProps} />;
      case 'right': return <ArrowLeft {...arrowProps} />;
      default: return null;
    }
  };

  // Manage body scroll lock while tutorial is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('tutorial-open');
      // Add custom CSS for tutorial overlay
      const style = document.createElement('style');
      style.textContent = `
        .tutorial-open {
          overflow: hidden;
        }
        .tutorial-highlight {
          position: relative !important;
          z-index: 105 !important;
          outline: 3px solid #3b82f6 !important;
          outline-offset: 4px !important;
          border-radius: 12px !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.3) !important;
          animation: tutorialHighlight 2s infinite !important;
        }
        @keyframes tutorialHighlight {
          0%, 100% { outline-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { outline-color: #1d4ed8; box-shadow: 0 0 0 6px rgba(29, 78, 216, 0.3), 0 0 30px rgba(29, 78, 216, 0.4); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `;
      style.id = 'tutorial-styles';
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('tutorial-open');
      const existingStyle = document.getElementById('tutorial-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
    
    return () => {
      document.body.classList.remove('tutorial-open');
      const existingStyle = document.getElementById('tutorial-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
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
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
      >
        {/* Add spotlight effect */}
        <TutorialSpotlight 
          elementPosition={elementPosition} 
          isVisible={currentStepData.showSpotlight && !!elementPosition} 
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