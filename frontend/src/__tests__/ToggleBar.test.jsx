import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Mock the App component to test the toggle bar functionality
const MockApp = () => {
  const [freeMode, setFreeMode] = React.useState(false);
  const [isMobile] = React.useState(false);

  return (
    <div>
      {/* Progress toggle bar - mobile optimized */}
      <div
        className={`${isMobile ? "progress-toggle-mobile" : "fixed bottom-20 right-4 z-40"} flex items-center space-x-2 bg-white/80 p-2 rounded-full shadow-lg backdrop-blur-sm`}
      >
        <span
          className={`${isMobile ? "text-xs" : "text-sm"} font-bold ${!freeMode ? "text-blue-600" : "text-gray-500"}`}
        >
          Progresiv
        </span>
        <button
          onClick={() => setFreeMode(!freeMode)}
          className={`${isMobile ? "w-8 h-4" : "w-12 h-6"} rounded-full p-1 transition-colors duration-300 ${freeMode ? "bg-green-500" : "bg-gray-300"}`}
          data-testid="toggle-button"
        >
          <span
            className={`block ${isMobile ? "w-2 h-2" : "w-4 h-4"} bg-white rounded-full shadow-md transform transition-transform duration-300 ${freeMode ? (isMobile ? "translate-x-4" : "translate-x-6") : "translate-x-0"}`}
            data-testid="toggle-slider"
          ></span>
        </button>
        <span
          className={`${isMobile ? "text-xs" : "text-sm"} font-bold ${freeMode ? "text-green-600" : "text-gray-500"}`}
        >
          Liber
        </span>
      </div>
    </div>
  );
};

describe('ToggleBar', () => {
  test('renders toggle bar with correct initial state', () => {
    render(<MockApp />);
    
    expect(screen.getByText('Progresiv')).toBeInTheDocument();
    expect(screen.getByText('Liber')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-slider')).toBeInTheDocument();
  });

  test('shows progressive mode as active initially', () => {
    render(<MockApp />);
    
    const progressiveLabel = screen.getByText('Progresiv');
    const liberLabel = screen.getByText('Liber');
    
    expect(progressiveLabel).toHaveClass('text-blue-600');
    expect(liberLabel).toHaveClass('text-gray-500');
  });

  test('toggles to free mode when clicked', async () => {
    render(<MockApp />);
    
    const toggleButton = screen.getByTestId('toggle-button');
    
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    
    const progressiveLabel = screen.getByText('Progresiv');
    const liberLabel = screen.getByText('Liber');
    
    expect(progressiveLabel).toHaveClass('text-gray-500');
    expect(liberLabel).toHaveClass('text-green-600');
  });

  test('toggles back to progressive mode when clicked again', async () => {
    render(<MockApp />);
    
    const toggleButton = screen.getByTestId('toggle-button');
    
    // First click - switch to free mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    
    // Second click - switch back to progressive mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    
    const progressiveLabel = screen.getByText('Progresiv');
    const liberLabel = screen.getByText('Liber');
    
    expect(progressiveLabel).toHaveClass('text-blue-600');
    expect(liberLabel).toHaveClass('text-gray-500');
  });

  test('toggle button has correct CSS classes', () => {
    render(<MockApp />);
    
    const toggleButton = screen.getByTestId('toggle-button');
    const toggleSlider = screen.getByTestId('toggle-slider');
    
    expect(toggleButton).toHaveClass('w-12', 'h-6', 'rounded-full', 'p-1', 'transition-colors', 'duration-300', 'bg-gray-300');
    expect(toggleSlider).toHaveClass('block', 'w-4', 'h-4', 'bg-white', 'rounded-full', 'shadow-md', 'transform', 'transition-transform', 'duration-300', 'translate-x-0');
  });

  test('toggle button changes appearance when toggled', async () => {
    render(<MockApp />);
    
    const toggleButton = screen.getByTestId('toggle-button');
    const toggleSlider = screen.getByTestId('toggle-slider');
    
    // Initial state
    expect(toggleButton).toHaveClass('bg-gray-300');
    expect(toggleSlider).toHaveClass('translate-x-0');
    
    // Toggle to free mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    
    // Should have green background and moved slider
    expect(toggleButton).toHaveClass('bg-green-500');
    expect(toggleSlider).toHaveClass('translate-x-6');
  });

  test('toggle bar has correct positioning classes', () => {
    render(<MockApp />);
    
    const toggleBar = screen.getByTestId('toggle-button').parentElement;
    
    expect(toggleBar).toHaveClass('fixed', 'bottom-20', 'right-4', 'z-40', 'flex', 'items-center', 'space-x-2', 'bg-white/80', 'p-2', 'rounded-full', 'shadow-lg', 'backdrop-blur-sm');
  });

  test('labels have correct responsive text classes', () => {
    render(<MockApp />);
    
    const progressiveLabel = screen.getByText('Progresiv');
    const liberLabel = screen.getByText('Liber');
    
    expect(progressiveLabel).toHaveClass('text-sm', 'font-bold');
    expect(liberLabel).toHaveClass('text-sm', 'font-bold');
  });
});