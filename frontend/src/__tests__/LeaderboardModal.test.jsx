import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LeaderboardModal } from '../components/LeaderboardModal';

// Mock the dependencies
jest.mock('../data/competitionQuestions', () => ({
  competitionQuestions: {
    fachbegriffe: {
      title: "Fachbegriffe Flash",
      questions: []
    }
  },
  competitionConfig: {
    competitions: []
  }
}));

jest.mock('../utils/gamificationManager', () => ({
  gamificationManager: {
    completeQuiz: jest.fn(),
    awardPoints: jest.fn()
  }
}));

describe('LeaderboardModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  test('renders without crashing when competitions is empty', () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    // Should render the modal title
    expect(screen.getByText('Clasament & Competiții')).toBeInTheDocument();
    
    // Should render both tabs
    expect(screen.getByText('🏆 Clasament')).toBeInTheDocument();
    expect(screen.getByText('🎮 Competiții')).toBeInTheDocument();
  });

  test('renders competitions tab without crashing', () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    // Click on competitions tab
    const competitionsTab = screen.getByText('🎮 Competiții');
    act(() => {
      competitionsTab.click();
    });
    
    // Should show competitions section
    expect(screen.getByText('Competiții Active')).toBeInTheDocument();
    expect(screen.getByText('Alătură-te provocărilor și câștigă XP bonus!')).toBeInTheDocument();
  });

  test('renders leaderboard tab correctly', () => {
    render(<LeaderboardModal {...defaultProps} />);
    
    // Should show leaderboard by default
    expect(screen.getByText('Total XP')).toBeInTheDocument();
    expect(screen.getByText('Step Progress')).toBeInTheDocument();
    expect(screen.getByText('FSP Cases')).toBeInTheDocument();
  });

  test('handles missing competitionConfig gracefully', () => {
    // Mock with undefined competitionConfig
    jest.doMock('../data/competitionQuestions', () => ({
      competitionQuestions: {},
      competitionConfig: undefined
    }));

    // Should not crash
    expect(() => {
      render(<LeaderboardModal {...defaultProps} />);
    }).not.toThrow();
  });
});