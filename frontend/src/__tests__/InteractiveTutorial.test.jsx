import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { InteractiveTutorial } from '../components/InteractiveTutorial';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => <div>{children}</div>
}));

describe('InteractiveTutorial', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onComplete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders tutorial when open', () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    expect(screen.getByText(/Bun venit/)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<InteractiveTutorial {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText(/Bun venit/)).not.toBeInTheDocument();
  });

  test('navigates through tutorial steps', async () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Should start with welcome step
    expect(screen.getByText(/Bun venit/)).toBeInTheDocument();
    
    // Click next to go to next step
    const nextButton = screen.getByText(/Următorul/);
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Should show next step content
    expect(screen.getByText(/Navigare/)).toBeInTheDocument();
  });

  test('navigates back through tutorial steps', async () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Go to next step first
    const nextButton = screen.getByText(/Următorul/);
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Go back
    const prevButton = screen.getByText(/Anterior/);
    await act(async () => {
      fireEvent.click(prevButton);
    });
    
    // Should be back to welcome step
    expect(screen.getByText(/Bun venit/)).toBeInTheDocument();
  });

  test('closes tutorial when clicking close button', async () => {
    const onClose = jest.fn();
    render(<InteractiveTutorial {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  test('completes tutorial when reaching the end', async () => {
    const onComplete = jest.fn();
    render(<InteractiveTutorial {...defaultProps} onComplete={onComplete} />);
    
    // Navigate through all steps
    for (let i = 0; i < 5; i++) {
      const nextButton = screen.getByText(/Următorul/);
      await act(async () => {
        fireEvent.click(nextButton);
      });
    }
    
    // Should show completion step
    expect(screen.getByText(/Felicitări/)).toBeInTheDocument();
    
    // Click finish
    const finishButton = screen.getByText(/Terminat/);
    await act(async () => {
      fireEvent.click(finishButton);
    });
    
    expect(onComplete).toHaveBeenCalled();
  });

  test('shows progress indicator', () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Should show step indicator
    expect(screen.getByText(/1 din 6/)).toBeInTheDocument();
  });

  test('updates progress when navigating', async () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Initial progress
    expect(screen.getByText(/1 din 6/)).toBeInTheDocument();
    
    // Go to next step
    const nextButton = screen.getByText(/Următorul/);
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Updated progress
    expect(screen.getByText(/2 din 6/)).toBeInTheDocument();
  });

  test('handles keyboard navigation', async () => {
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Press Escape to close
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('validates CSS targets exist', () => {
    // Mock document.querySelector to simulate missing elements
    const originalQuerySelector = document.querySelector;
    document.querySelector = jest.fn(() => null);
    
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Should still render without crashing
    expect(screen.getByText(/Bun venit/)).toBeInTheDocument();
    
    // Restore original function
    document.querySelector = originalQuerySelector;
  });

  test('handles step content with valid CSS targets', () => {
    // Mock document.querySelector to simulate existing elements
    const originalQuerySelector = document.querySelector;
    document.querySelector = jest.fn(() => ({
      getBoundingClientRect: () => ({ top: 100, left: 100, width: 200, height: 100 }),
      scrollIntoView: jest.fn()
    }));
    
    render(<InteractiveTutorial {...defaultProps} />);
    
    // Should render normally
    expect(screen.getByText(/Bun venit/)).toBeInTheDocument();
    
    // Restore original function
    document.querySelector = originalQuerySelector;
  });
});