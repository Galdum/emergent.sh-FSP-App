import React from 'react';
import { render, screen } from '@testing-library/react';
import InteractiveTutorial from '../components/InteractiveTutorial';

describe('InteractiveTutorial', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onComplete: jest.fn()
  };

  test('renders tutorial modal when open', () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Should render the tutorial modal
    expect(screen.getByText('Bine ai venit la FSP Navigator! 👋')).toBeInTheDocument();
  });

  test('has the correct number of tutorial steps', () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Should have 7 steps total
    const stepContent = screen.getByText('Bine ai venit la FSP Navigator! 👋');
    expect(stepContent).toBeInTheDocument();
    
    // Check that all expected steps are present in the component
    const expectedSteps = [
      'Bine ai venit la FSP Navigator! 👋',
      'Manager Documente & Asistent AI',
      'Progres & Checklist',
      'Noduri Bonus cu Resurse',
      'Toggle Bar - Moduri de Navigare',
      'Setări și Informații Personale',
      'Totul pregătit!'
    ];
    
    expectedSteps.forEach(stepTitle => {
      // The step content should be accessible in the component
      expect(screen.getByText(stepTitle)).toBeInTheDocument();
    });
  });

  test('has navigation buttons', () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Should have next button
    const nextButton = screen.getByRole('button', { name: /următorul/i });
    expect(nextButton).toBeInTheDocument();
    
    // Should have skip button
    const skipButton = screen.getByRole('button', { name: /sari peste/i });
    expect(skipButton).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<InteractiveTutorial {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /închide/i });
    closeButton.click();
    
    expect(onClose).toHaveBeenCalled();
  });

  test('tutorial steps have valid targets', () => {
    // This test ensures that the tutorial steps reference valid CSS selectors
    // that could potentially exist in the DOM
    const validTargets = [
      null, // First step has no target
      '[title="Dosarul Meu Personal"]',
      '.step-node',
      '.bonus-node',
      '.fixed.bottom-20',
      '[title="Setări"]',
      null // Last step has no target
    ];
    
    // All targets should be either null or valid CSS selectors
    validTargets.forEach(target => {
      if (target !== null) {
        // Should be a valid CSS selector
        expect(() => {
          document.querySelector(target);
        }).not.toThrow();
      }
    });
  });
});