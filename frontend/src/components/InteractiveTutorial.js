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

// Enhanced spotlight component that highlights elements properly
const TutorialSpotlight = ({ elementPosition, isVisible, currentStep }) => {
  useEffect(() => {
    if (!isVisible || !elementPosition) {
      // Remove blur from all elements
      document.querySelectorAll('*').forEach(el => {
        if (el.style && el.style.filter && el.style.filter.includes('blur')) {
          el.style.filter = el.style.filter.replace(/blur\([^)]*\)/g, '').trim();
          if (!el.style.filter) {
            el.style.filter = '';
          }
        }
      });
      return;
    }

    // Add blur to the main app container but not to the highlighted element
    const mainContainer = document.querySelector('.main-container, .App, [data-testid="app-container"]') || document.body;
    
    // Apply blur to background
    const elementsToBlur = [
      'main',
      '.main-container',
      '.journey-map-container',
      '.svg-container',
      '.header-container',
      '.content-wrapper'
    ];
    
    elementsToBlur.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.style) {
          el.style.filter = 'blur(3px)';
          el.style.transition = 'filter 0.3s ease';
        }
      });
    });
    
  }, [isVisible, elementPosition]);

  if (!isVisible || !elementPosition) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="tutorial-spotlight-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 101,
        pointerEvents: 'none',
        background: `radial-gradient(circle at ${elementPosition.centerX}px ${elementPosition.centerY}px, 
          transparent ${Math.max(elementPosition.width, elementPosition.height) / 2 + 30}px, 
          rgba(0,0,0,0.7) ${Math.max(elementPosition.width, elementPosition.height) / 2 + 50}px)`
      }}
    />
  );
};

// Enhanced floating arrow component that points accurately to highlighted elements
const TutorialArrow = ({ elementPosition, position, isVisible, stepData }) => {
  if (!isVisible || !elementPosition) return null;

  const getArrowPosition = () => {
    const offset = 40;
    const arrowSize = 32;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Convert viewport coordinates to absolute coordinates
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    let left, top, rotate, ArrowComponent;
    
    switch (position) {
      case 'top':
        left = elementPosition.centerX - arrowSize / 2;
        top = elementPosition.top - offset - arrowSize;
        rotate = 'rotate(180deg)';
        ArrowComponent = ArrowDown;
        break;
      case 'bottom':
        left = elementPosition.centerX - arrowSize / 2;
        top = elementPosition.bottom + offset;
        rotate = 'rotate(0deg)';
        ArrowComponent = ArrowDown;
        break;
      case 'left':
        left = elementPosition.left - offset - arrowSize;
        top = elementPosition.centerY - arrowSize / 2;
        rotate = 'rotate(90deg)';
        ArrowComponent = ArrowRight;
        break;
      case 'right':
        left = elementPosition.right + offset;
        top = elementPosition.centerY - arrowSize / 2;
        rotate = 'rotate(-90deg)';
        ArrowComponent = ArrowLeft;
        break;
      default:
        left = elementPosition.centerX - arrowSize / 2;
        top = elementPosition.top - offset - arrowSize;
        rotate = 'rotate(180deg)';
        ArrowComponent = ArrowDown;
    }
    
    // Ensure arrow stays within viewport
    left = Math.max(10, Math.min(left, viewportWidth - arrowSize - 10));
    top = Math.max(10, Math.min(top, viewportHeight - arrowSize - 10));
    
    return { left, top, rotate, ArrowComponent };
  };

  const arrowStyle = getArrowPosition();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="tutorial-arrow"
      style={{
        position: 'fixed',
        left: arrowStyle.left,
        top: arrowStyle.top,
        zIndex: 103,
        pointerEvents: 'none',
        transform: arrowStyle.rotate,
      }}
    >
      <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg animate-bounce">
        <arrowStyle.ArrowComponent size={24} />
      </div>
    </motion.div>
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

  // Enhanced element highlighting and interaction
  const handleStepAction = useCallback((action) => {
    if (!action) return;
    
    // Remove any existing highlights first
    cleanupAllTutorialElements();

    switch (action) {
      case 'highlight_personal_files':
        const personalFileBtn = document.querySelector('[title="Dosarul Meu Personal"]');
        if (personalFileBtn) {
          personalFileBtn.classList.add('tutorial-highlight', 'tutorial-spotlight-active');
          personalFileBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Enhanced styling for visibility
          personalFileBtn.style.position = 'relative';
          personalFileBtn.style.zIndex = '105';
          personalFileBtn.style.filter = 'none';
          personalFileBtn.style.animation = 'tutorialPulse 2s infinite';
        }
        break;
        
      case 'highlight_progress_steps':
        // Target both regular and mobile step nodes
        const stepSelectors = [
          '.step-node',
          '.step-node-mobile',
          'g.step-node-mobile',
          'g:has(.step-node)',
          'circle[class*="fill-blue-500"], circle[class*="fill-green-500"]'
        ];
        
        let stepNodes = [];
        stepSelectors.forEach(selector => {
          const nodes = document.querySelectorAll(selector);
          nodes.forEach(node => {
            if (!stepNodes.includes(node)) {
              stepNodes.push(node);
            }
          });
        });
        
        stepNodes.forEach((node, index) => {
          node.classList.add('tutorial-highlight', 'tutorial-spotlight-active');
          node.style.position = 'relative';
          node.style.zIndex = '105';
          node.style.filter = 'none';
          // Stagger the animations
          setTimeout(() => {
            if (node.style) {
              node.style.animation = 'tutorialPulse 2s infinite';
            }
          }, index * 150);
        });
        
        if (stepNodes.length > 0) {
          stepNodes[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
        
      case 'highlight_bonus_nodes':
        // Target both regular and mobile bonus nodes
        const bonusSelectors = [
          '.bonus-node',
          '.bonus-node-mobile',
          'g.bonus-node-mobile',
          'g:has(.bonus-node)',
          'circle[class*="fill-orange-500"]'
        ];
        
        let bonusNodes = [];
        bonusSelectors.forEach(selector => {
          const nodes = document.querySelectorAll(selector);
          nodes.forEach(node => {
            if (!bonusNodes.includes(node)) {
              bonusNodes.push(node);
            }
          });
        });
        
        bonusNodes.forEach((node, index) => {
          node.classList.add('tutorial-highlight', 'tutorial-spotlight-active');
          node.style.position = 'relative';
          node.style.zIndex = '105';
          node.style.filter = 'none';
          // Stagger the animations
          setTimeout(() => {
            if (node.style) {
              node.style.animation = 'tutorialPulse 2s infinite';
            }
          }, index * 200);
        });
        
        if (bonusNodes.length > 0) {
          bonusNodes[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
        
      case 'highlight_toggle_bar':
        // Try both mobile and desktop toggle bar selectors
        const toggleBarSelectors = [
          '.progress-toggle-mobile',
          '.fixed.bottom-20',
          '[class*="fixed"][class*="bottom"]',
          'button[class*="toggle"]'
        ];
        
        let toggleBar = null;
        toggleBarSelectors.forEach(selector => {
          if (!toggleBar) {
            toggleBar = document.querySelector(selector);
          }
        });
        
        if (toggleBar) {
          toggleBar.classList.add('tutorial-highlight', 'tutorial-spotlight-active');
          toggleBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toggleBar.style.position = 'relative';
          toggleBar.style.zIndex = '105';
          toggleBar.style.filter = 'none';
          toggleBar.style.animation = 'tutorialPulse 2s infinite';
        }
        break;
        
      case 'highlight_settings':
        const settingsBtn = document.querySelector('[title="Setări"]');
        if (settingsBtn) {
          settingsBtn.classList.add('tutorial-highlight', 'tutorial-spotlight-active');
          settingsBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          settingsBtn.style.position = 'relative';
          settingsBtn.style.zIndex = '105';
          settingsBtn.style.filter = 'none';
          settingsBtn.style.animation = 'tutorialPulse 2s infinite';
        }
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

  // Enhanced manage body scroll lock and styling while tutorial is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('tutorial-open');
      // Enhanced custom CSS for tutorial overlay
      const style = document.createElement('style');
      style.textContent = `
        .tutorial-open {
          overflow: hidden;
        }
        
        .tutorial-highlight {
          position: relative !important;
          z-index: 105 !important;
          outline: 4px solid #3b82f6 !important;
          outline-offset: 8px !important;
          border-radius: 16px !important;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.6) !important;
          animation: tutorialHighlight 2s infinite !important;
          background: rgba(59, 130, 246, 0.1) !important;
          filter: none !important;
        }
        
        .tutorial-spotlight-active {
          filter: none !important;
          transform: scale(1.05) !important;
          transition: all 0.3s ease !important;
        }
        
        @keyframes tutorialHighlight {
          0%, 100% { 
            outline-color: #3b82f6; 
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.6);
            transform: scale(1.05);
          }
          50% { 
            outline-color: #1d4ed8; 
            box-shadow: 0 0 0 12px rgba(29, 78, 216, 0.5), 0 0 60px rgba(29, 78, 216, 0.7);
            transform: scale(1.08);
          }
        }
        
        @keyframes tutorialPulse {
          0%, 100% { 
            transform: scale(1.05); 
            opacity: 1;
          }
          50% { 
            transform: scale(1.1); 
            opacity: 0.9;
          }
        }
        
        /* Enhanced SVG node highlighting */
        g.tutorial-highlight circle,
        g.tutorial-spotlight-active circle {
          filter: none !important;
          transform: scale(1.2) !important;
          transition: all 0.3s ease !important;
        }
        
        /* Make sure tutorial modal is above everything */
        .tutorial-modal-responsive {
          z-index: 110 !important;
        }
        
        /* Enhanced arrow visibility */
        .tutorial-arrow {
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)) !important;
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
      // Clean up any remaining highlights when tutorial closes
      cleanupAllTutorialElements();
    }
    
    return () => {
      document.body.classList.remove('tutorial-open');
      const existingStyle = document.getElementById('tutorial-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      // Clean up any remaining highlights on component unmount
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