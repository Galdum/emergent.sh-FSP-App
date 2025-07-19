import { competitionQuestions, competitionConfig } from '../data/competitionQuestions';

describe('Competition Questions Data', () => {
  test('competitionQuestions should be defined and have required game types', () => {
    expect(competitionQuestions).toBeDefined();
    expect(competitionQuestions.fachbegriffe).toBeDefined();
    expect(competitionQuestions.diagnostic).toBeDefined();
    expect(competitionQuestions.grammar).toBeDefined();
  });

  test('each game type should have required properties', () => {
    const gameTypes = ['fachbegriffe', 'diagnostic', 'grammar'];
    
    gameTypes.forEach(gameType => {
      const game = competitionQuestions[gameType];
      expect(game.title).toBeDefined();
      expect(game.description).toBeDefined();
      expect(game.questions).toBeDefined();
      expect(Array.isArray(game.questions)).toBe(true);
      expect(game.questions.length).toBeGreaterThan(0);
    });
  });

  test('each question should have required properties', () => {
    Object.values(competitionQuestions).forEach(game => {
      game.questions.forEach(question => {
        expect(question.question).toBeDefined();
        expect(question.options).toBeDefined();
        expect(question.correct).toBeDefined();
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options.length).toBeGreaterThan(0);
        expect(typeof question.correct).toBe('number');
        expect(question.correct).toBeGreaterThanOrEqual(0);
        expect(question.correct).toBeLessThan(question.options.length);
      });
    });
  });

  test('competitionConfig should be defined and have competitions array', () => {
    expect(competitionConfig).toBeDefined();
    expect(competitionConfig.competitions).toBeDefined();
    expect(Array.isArray(competitionConfig.competitions)).toBe(true);
  });

  test('each competition should have required properties', () => {
    competitionConfig.competitions.forEach(competition => {
      expect(competition.id).toBeDefined();
      expect(competition.title).toBeDefined();
      expect(competition.description).toBeDefined();
      expect(competition.gameType).toBeDefined();
      expect(competition.status).toBeDefined();
      expect(competition.participants).toBeDefined();
      expect(competition.timeLimit).toBeDefined();
      expect(competition.reward).toBeDefined();
      expect(competition.minScore).toBeDefined();
      expect(competition.bonusPoints).toBeDefined();
    });
  });

  test('competition gameTypes should match available game types', () => {
    const availableGameTypes = Object.keys(competitionQuestions);
    
    competitionConfig.competitions.forEach(competition => {
      expect(availableGameTypes).toContain(competition.gameType);
    });
  });

  test('snapshot test for data structure', () => {
    expect(competitionQuestions).toMatchSnapshot();
    expect(competitionConfig).toMatchSnapshot();
  });
});