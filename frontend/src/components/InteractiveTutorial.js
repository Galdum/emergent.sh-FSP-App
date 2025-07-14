import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check, ArrowDown, ArrowUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced cleanup function to ensure all tutorial elements are properly reset
const cleanupAllTutorialElements = () => {
  // Remove tutorial highlight classes
  document.querySelectorAll('.tutorial-highlight, .tutorial-ring, .tutorial-spotlight-active').forEach(el => {
    el.classList.remove('tutorial-highlight', 'tutorial-ring', 'tutorial-spotlight-active');
    if (el.style) {
      el.style.animation = '';
      el.style.outline = '';
      el.style.boxShadow = '';
      el.style.background = '';
      el.style.zIndex = '';
      el.style.position = '';
      el.style.transform = '';
      el.style.filter = '';
    }
  });

  // Explicitly target specific elements that might have been highlighted
  const specificSelectors = [
    '[title="Dosarul Meu Personal"]',
    '[title="Setări"]',
    '.step-node',
    '.bonus-node',
    '.step-node-mobile',
    '.bonus-node-mobile',
    '.progress-toggle-mobile',
    '.fixed.bottom-20',
    'g.step-node-mobile',
    'g.bonus-node-mobile',
    'g:has(.step-node)',
    'g:has(.bonus-node)'
  ];

  specificSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.classList.remove('tutorial-highlight', 'tutorial-ring', 'tutorial-spotlight-active');
      if (el.style) {
        el.style.animation = '';
        el.style.outline = '';
        el.style.boxShadow = '';
        el.style.background = '';
        el.style.zIndex = '';
        el.style.position = '';
        el.style.transform = '';
        el.style.filter = '';
      }
    });
  });

  // Remove any tutorial-related CSS classes from body
  document.body.classList.remove('tutorial-open');
  
  // Remove blur from all elements
  document.querySelectorAll('*').forEach(el => {
    if (el.style && el.style.filter && el.style.filter.includes('blur')) {
      el.style.filter = el.style.filter.replace(/blur\([^)]*\)/g, '').trim();
      if (!el.style.filter) {
        el.style.filter = '';
      }
    }
  });
};

// Simple spotlight - just highlight the element, don't blur anything else
const TutorialSpotlight = ({ elementPosition, isVisible }) => {
  if (!isVisible || !elementPosition) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="tutorial-spotlight-ring"
      style={{
        position: 'fixed',
        top: elementPosition.top - 20,
        left: elementPosition.left - 20,
        width: elementPosition.width + 40,
        height: elementPosition.height + 40,
        border: '4px solid #3b82f6',
        borderRadius: '12px',
        boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.5)',
        zIndex: 104,
        pointerEvents: 'none',
        animation: 'tutorialPulse 2s infinite'
      }}
    />
  );
};

// Simple arrow - only show when it makes sense
const TutorialArrow = ({ elementPosition, position, isVisible, stepData }) => {
  if (!isVisible || !elementPosition || !shouldShowArrow(stepData)) return null;

  const getArrowStyle = () => {
    const offset = 50;
    
    switch (position) {
      case 'top':
        return {
          top: elementPosition.top - offset,
          left: elementPosition.centerX - 15,
          transform: 'rotate(180deg)'
        };
      case 'bottom':
        return {
          top: elementPosition.bottom + 20,
          left: elementPosition.centerX - 15,
          transform: 'rotate(0deg)'
        };
      case 'left':
        return {
          top: elementPosition.centerY - 15,
          left: elementPosition.left - offset,
          transform: 'rotate(90deg)'
        };
      case 'right':
        return {
          top: elementPosition.centerY - 15,
          left: elementPosition.right + 20,
          transform: 'rotate(-90deg)'
        };
      default:
        return null;
    }
  };

  const arrowStyle = getArrowStyle();
  if (!arrowStyle) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="tutorial-arrow"
      style={{
        position: 'fixed',
        zIndex: 105,
        pointerEvents: 'none',
        ...arrowStyle
      }}
    >
      <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg animate-bounce">
        <ArrowDown size={20} />
      </div>
    </motion.div>
  );
};

// Helper function to determine if arrow should be shown
const shouldShowArrow = (stepData) => {
  if (!stepData || !stepData.target) return false;
  
  // Only show arrow for specific steps that need pointing
  const arrowSteps = ['highlight_settings', 'highlight_toggle_bar', 'highlight_personal_files'];
  return arrowSteps.includes(stepData.action);
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
      title: 'Manager Documente & Asistent AI',
      content: 'Încarcă rapid rapoarte, diplome și notițe în acest hub personal. Aici găsești și Asistentul AI care te ajută cu întrebări despre Approbation & FSP. (Poți da click după tutorial pentru a-l deschide)',
      target: '[title="Dosarul Meu Personal"]',
      position: 'left',
      action: 'highlight_personal_files',
      showSpotlight: true,
    },
    {
      title: 'Progres & Checklist',
      content: 'Urmărește aici fiecare pas finalizat şi ce mai ai de făcut. Fiecare nod albastru reprezintă un pas important în procesul de Approbation.',
      target: '.step-node',
      position: 'bottom',
      action: 'highlight_progress_steps',
      showSpotlight: true,
    },
    {
      title: 'Noduri Bonus cu Resurse',
      content: 'Nodurile portocalii conțin resurse bonus: Hub-ul de Informații, Generatorul de Email-uri și Recomandatorul de Landuri.',
      target: '.bonus-node',
      position: 'top',
      action: 'highlight_bonus_nodes',
      showSpotlight: true,
    },
    {
      title: 'Toggle Bar - Moduri de Navigare',
      content: 'Aici poți comuta între modul Progresiv (pas cu pas) și modul Liber (acces la toate nodurile). Modul Progresiv te ghidează step-by-step.',
      target: '.progress-toggle-mobile, .fixed.bottom-20',
      position: 'top',
      action: 'highlight_toggle_bar',
      showSpotlight: true,
    },
    {
      title: 'Setări și Informații Personale',
      content: 'În Setări poți actualiza informațiile personale, schimba parola, administra abonamentul și descărca datele tale.',
      target: '[title="Setări"]',
      position: 'left',
      action: 'highlight_settings',
      showSpotlight: true,
    },
    {
      title: 'Totul pregătit!',
      content: 'Perfect! Acum știi unde să găsești toate funcționalitățile importante. Poţi relua tutorialul din meniul de setări oricând 🥳',
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

  // Simple highlighting - just make elements visible and pulsing
  const handleStepAction = useCallback((action) => {
    if (!action) return;
    
    // Remove any existing highlights first
    cleanupAllTutorialElements();

    const addHighlight = (element) => {
      if (!element) return;
      
      element.style.position = 'relative';
      element.style.zIndex = '106';
      element.style.outline = '4px solid #3b82f6';
      element.style.outlineOffset = '4px';
      element.style.borderRadius = '8px';
      element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
      element.style.animation = 'tutorialPulse 2s infinite';
      
      // Make sure element is visible
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    switch (action) {
      case 'highlight_personal_files':
        const personalFileBtn = document.querySelector('[title="Dosarul Meu Personal"]');
        addHighlight(personalFileBtn);
        break;
        
      case 'highlight_progress_steps':
        const stepNodes = document.querySelectorAll('.step-node, .step-node-mobile, g.step-node, g.step-node-mobile');
        stepNodes.forEach((node, index) => {
          setTimeout(() => addHighlight(node), index * 200);
        });
        break;
        
      case 'highlight_bonus_nodes':
        const bonusNodes = document.querySelectorAll('.bonus-node, .bonus-node-mobile, g.bonus-node, g.bonus-node-mobile');
        bonusNodes.forEach((node, index) => {
          setTimeout(() => addHighlight(node), index * 200);
        });
        break;
        
      case 'highlight_toggle_bar':
        const toggleBar = document.querySelector('.progress-toggle-mobile') || 
                         document.querySelector('.fixed.bottom-20') ||
                         document.querySelector('[class*="toggle"]');
        addHighlight(toggleBar);
        break;
        
      case 'highlight_settings':
        const settingsBtn = document.querySelector('[title="Setări"]');
        addHighlight(settingsBtn);
        break;
    }
  }, []);

  // Enhanced calculate element position and update state
  const updateElementPosition = useCallback(() => {
    if (!currentStepData.target) {
      setElementPosition(null);
      return;
    }
    
    // Handle multiple target selectors
    const targets = currentStepData.target.split(', ');
    let element = null;
    
    for (const target of targets) {
      // Try different approaches to find the element
      element = document.querySelector(target);
      if (element) break;
      
      // Try finding by partial class match for step/bonus nodes
      if (target.includes('.step-node')) {
        element = document.querySelector('g.step-node-mobile') || 
                  document.querySelector('circle[class*="fill-blue-500"]') ||
                  document.querySelector('circle[class*="fill-green-500"]');
      }
      if (target.includes('.bonus-node')) {
        element = document.querySelector('g.bonus-node-mobile') || 
                  document.querySelector('circle[class*="fill-orange-500"]');
      }
      if (element) break;
    }
    
    if (!element) {
      setElementPosition(null);
      return;
    }
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Enhanced position calculation
    const elementData = {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      bottom: rect.bottom + scrollTop,
      right: rect.right + scrollLeft,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + scrollLeft + rect.width / 2,
      centerY: rect.top + scrollTop + rect.height / 2,
      element: element // Keep reference to element for better targeting
    };
    
    setElementPosition(elementData);
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
      cleanupAllTutorialElements();
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
    // Enhanced cleanup of highlights and animations
    cleanupAllTutorialElements();
    localStorage.setItem('tutorialViewed', 'true');
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    // Enhanced cleanup of highlights and animations
    cleanupAllTutorialElements();
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

  // Simplified styling
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('tutorial-open');
      // Simple CSS for tutorial
      const style = document.createElement('style');
      style.textContent = `
        .tutorial-open {
          overflow: hidden;
        }
        
        @keyframes tutorialPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1;
          }
          50% { 
            transform: scale(1.05); 
            opacity: 0.9;
          }
        }
        
        .tutorial-modal-responsive {
          z-index: 110 !important;
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
      cleanupAllTutorialElements();
    }
    
    return () => {
      document.body.classList.remove('tutorial-open');
      const existingStyle = document.getElementById('tutorial-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      cleanupAllTutorialElements();
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