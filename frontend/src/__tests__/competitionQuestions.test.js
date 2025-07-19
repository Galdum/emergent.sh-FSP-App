import { competitionQuestions, competitionConfig } from '../data/competitionQuestions';

describe('Competition Questions Data', () => {
  test('competitionQuestions should have the expected structure', () => {
    expect(competitionQuestions).toMatchSnapshot();
  });

  test('competitionConfig should have the expected structure', () => {
    expect(competitionConfig).toMatchSnapshot();
  });

  test('competitionConfig.competitions should be an array', () => {
    expect(Array.isArray(competitionConfig.competitions)).toBe(true);
  });

  test('competitionConfig.competitions should not be empty', () => {
    expect(competitionConfig.competitions.length).toBeGreaterThan(0);
  });

  test('each competition should have required properties', () => {
    competitionConfig.competitions.forEach(competition => {
      expect(competition).toHaveProperty('id');
      expect(competition).toHaveProperty('title');
      expect(competition).toHaveProperty('description');
      expect(competition).toHaveProperty('gameType');
      expect(competition).toHaveProperty('status');
      expect(competition).toHaveProperty('participants');
      expect(competition).toHaveProperty('timeLimit');
      expect(competition).toHaveProperty('reward');
    });
  });

  test('each gameType should have corresponding questions', () => {
    competitionConfig.competitions.forEach(competition => {
      expect(competitionQuestions).toHaveProperty(competition.gameType);
      expect(competitionQuestions[competition.gameType]).toHaveProperty('questions');
      expect(Array.isArray(competitionQuestions[competition.gameType].questions)).toBe(true);
    });
  });
});