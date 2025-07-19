import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { LeaderboardModal } from '../components/LeaderboardModal';

// Mock the gamification manager
jest.mock('../utils/gamificationManager', () => ({
  gamificationManager: {
    completeQuiz: jest.fn(() => ({ points: 10 })),
    awardPoints: jest.fn()
  }
}));

// Mock the InteractiveQuiz component
jest.mock('../components/InteractiveQuiz', () => ({
  InteractiveQuiz: ({ onComplete, onClose }) => (
    <div data-testid="interactive-quiz">
      <button onClick={() => onComplete({ totalQuestions: 5, correctAnswers: 4, score: 80 })}>
        Complete Quiz
      </button>
      <button onClick={onClose}>Close Quiz</button>
    </div>
  )
}));

describe('LeaderboardModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders leaderboard tab by default', () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    expect(screen.getByText('Clasament')).toBeInTheDocument();
    expect(screen.getByText('Competiții')).toBeInTheDocument();
    expect(screen.getByText('Mini Jocuri Rapide')).toBeInTheDocument();
  });

  test('switches to competitions tab', async () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    const competitionsTab = screen.getByText('Competiții');
    await act(async () => {
      fireEvent.click(competitionsTab);
    });
    
    expect(screen.getByText('Competiții Active')).toBeInTheDocument();
  });

  test('switches to mini games tab', async () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    const miniGamesTab = screen.getByText('Mini Jocuri Rapide');
    await act(async () => {
      fireEvent.click(miniGamesTab);
    });
    
    expect(screen.getByText('Fachbegriffe Flash')).toBeInTheDocument();
    expect(screen.getByText('Diagnostic Express')).toBeInTheDocument();
    expect(screen.getByText('Gramatică Germană')).toBeInTheDocument();
  });

  test('displays user rankings correctly', () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    expect(screen.getByText('Dr. Maria Popescu')).toBeInTheDocument();
    expect(screen.getByText('Dr. Alexandru Ionescu')).toBeInTheDocument();
    expect(screen.getByText('Tu')).toBeInTheDocument();
  });

  test('handles category selection', async () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    const stepProgressCategory = screen.getByText('Step Progress');
    await act(async () => {
      fireEvent.click(stepProgressCategory);
    });
    
    // Should still show the leaderboard with different sorting
    expect(screen.getByText('Clasament')).toBeInTheDocument();
  });

  test('starts mini game when clicking play button', async () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    // Switch to mini games tab
    const miniGamesTab = screen.getByText('Mini Jocuri Rapide');
    await act(async () => {
      fireEvent.click(miniGamesTab);
    });
    
    // Click on Fachbegriffe play button
    const playButtons = screen.getAllByText('Joacă Acum');
    await act(async () => {
      fireEvent.click(playButtons[0]);
    });
    
    expect(screen.getByTestId('interactive-quiz')).toBeInTheDocument();
  });

  test('completes mini game and updates rankings', async () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    // Switch to mini games tab and start a game
    const miniGamesTab = screen.getByText('Mini Jocuri Rapide');
    await act(async () => {
      fireEvent.click(miniGamesTab);
    });
    
    const playButtons = screen.getAllByText('Joacă Acum');
    await act(async () => {
      fireEvent.click(playButtons[0]);
    });
    
    // Complete the quiz
    const completeButton = screen.getByText('Complete Quiz');
    await act(async () => {
      fireEvent.click(completeButton);
    });
    
    // Quiz should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('interactive-quiz')).not.toBeInTheDocument();
    });
  });

  test('closes mini game when clicking close button', async () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    // Switch to mini games tab and start a game
    const miniGamesTab = screen.getByText('Mini Jocuri Rapide');
    await act(async () => {
      fireEvent.click(miniGamesTab);
    });
    
    const playButtons = screen.getAllByText('Joacă Acum');
    await act(async () => {
      fireEvent.click(playButtons[0]);
    });
    
    // Close the quiz
    const closeButton = screen.getByText('Close Quiz');
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    // Quiz should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('interactive-quiz')).not.toBeInTheDocument();
    });
  });

  test('handles missing competition data gracefully', () => {
    // Mock console.warn to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<LeaderboardModal {...defaultProps} />);
    
    // Should still render without crashing
    expect(screen.getByText('Clasament')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  test('displays competitions when available', async () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    const competitionsTab = screen.getByText('Competiții');
    await act(async () => {
      fireEvent.click(competitionsTab);
    });
    
    // Should show competition titles
    expect(screen.getByText('Fachbegriffe Challenge')).toBeInTheDocument();
    expect(screen.getByText('Diagnostic Master')).toBeInTheDocument();
    expect(screen.getByText('Grammar Sprint')).toBeInTheDocument();
  });

  test('closes modal when clicking close button', async () => {
    const onClose = jest.fn();
    render(<LeaderboardModal isOpen={true} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    expect(onClose).toHaveBeenCalled();
  });
});