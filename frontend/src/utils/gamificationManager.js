/**
 * Gamification System for Medical Licensing Guide
 * Handles points, levels, achievements, and user engagement features
 */

export class GamificationManager {
  constructor() {
    this.storageKey = 'gamification_data';
    this.data = this.loadGamificationData();
  }

  /**
   * Load gamification data from localStorage
   */
  loadGamificationData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultData();
    } catch (error) {
      console.error('Error loading gamification data:', error);
      return this.getDefaultData();
    }
  }

  /**
   * Get default gamification data structure
   */
  getDefaultData() {
    return {
      points: 0,
      level: 1,
      experience: 0,
      experienceToNext: 100,
      completedSteps: [],
      completedTasks: [],
      achievements: [],
      streakDays: 0,
      lastActiveDate: null,
      badges: [],
      quizStats: {
        totalQuizzes: 0,
        correctAnswers: 0,
        averageScore: 0
      },
      timeSpent: 0, // in minutes
      documentsUploaded: 0,
      aiInteractions: 0
    };
  }

  /**
   * Save gamification data to localStorage
   */
  saveGamificationData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  }

  /**
   * Award points for various actions
   */
  awardPoints(action, amount = null) {
    const pointsMap = {
      'complete_task': 10,
      'complete_step': 50,
      'upload_document': 15,
      'ai_interaction': 5,
      'quiz_correct': 20,
      'quiz_perfect': 100,
      'daily_login': 5,
      'streak_bonus': 25,
      'first_time_action': 30
    };

    const points = amount || pointsMap[action] || 0;
    this.data.points += points;
    this.data.experience += points;

    // Check for level up
    this.checkLevelUp();

    // Check for achievements
    this.checkAchievements(action);

    this.saveGamificationData();

    return {
      points: points,
      totalPoints: this.data.points,
      level: this.data.level,
      experience: this.data.experience,
      experienceToNext: this.data.experienceToNext,
      leveledUp: false // Will be set by checkLevelUp if needed
    };
  }

  /**
   * Check and handle level ups
   */
  checkLevelUp() {
    let leveledUp = false;
    
    while (this.data.experience >= this.data.experienceToNext) {
      this.data.experience -= this.data.experienceToNext;
      this.data.level++;
      this.data.experienceToNext = this.calculateExperienceForLevel(this.data.level + 1);
      leveledUp = true;

      // Award level up bonus
      this.data.points += 50;

      // Unlock achievements for milestones
      this.checkLevelMilestones();
    }

    if (leveledUp) {
      this.saveGamificationData();
    }

    return leveledUp;
  }

  /**
   * Calculate experience needed for a specific level
   */
  calculateExperienceForLevel(level) {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }

  /**
   * Complete a task and award points
   */
  completeTask(taskId, stepId) {
    if (!this.data.completedTasks.includes(taskId)) {
      this.data.completedTasks.push(taskId);
      const result = this.awardPoints('complete_task');
      
      // Check if all tasks in step are completed
      // This would need step data from the main app
      
      return { ...result, newTask: true };
    }
    return { points: 0, newTask: false };
  }

  /**
   * Complete a step and award points
   */
  completeStep(stepId) {
    if (!this.data.completedSteps.includes(stepId)) {
      this.data.completedSteps.push(stepId);
      return this.awardPoints('complete_step');
    }
    return { points: 0, newStep: false };
  }

  /**
   * Record quiz completion
   */
  completeQuiz(totalQuestions, correctAnswers) {
    this.data.quizStats.totalQuizzes++;
    this.data.quizStats.correctAnswers += correctAnswers;
    
    const score = (correctAnswers / totalQuestions) * 100;
    this.data.quizStats.averageScore = 
      (this.data.quizStats.averageScore * (this.data.quizStats.totalQuizzes - 1) + score) / 
      this.data.quizStats.totalQuizzes;

    let result;
    if (score === 100) {
      result = this.awardPoints('quiz_perfect');
    } else {
      result = this.awardPoints('quiz_correct', correctAnswers * 20);
    }

    this.saveGamificationData();
    return result;
  }

  /**
   * Check for achievements based on actions
   */
  checkAchievements(action) {
    const achievements = [
      {
        id: 'first_steps',
        title: '🚀 Primul Pas',
        description: 'Ai completat primul task!',
        condition: () => this.data.completedTasks.length >= 1
      },
      {
        id: 'task_master',
        title: '⭐ Master Task-uri',
        description: 'Ai completat 10 task-uri!',
        condition: () => this.data.completedTasks.length >= 10
      },
      {
        id: 'step_warrior',
        title: '🏆 Warrior Step-uri',
        description: 'Ai completat 3 step-uri complete!',
        condition: () => this.data.completedSteps.length >= 3
      },
      {
        id: 'quiz_enthusiast',
        title: '🧠 Enthusiast Quiz',
        description: 'Ai completat 5 quiz-uri!',
        condition: () => this.data.quizStats.totalQuizzes >= 5
      },
      {
        id: 'perfectionist',
        title: '💎 Perfectionist',
        description: 'Scor perfect la un quiz!',
        condition: () => this.data.quizStats.totalQuizzes > 0 && this.data.quizStats.averageScore >= 100
      },
      {
        id: 'ai_friend',
        title: '🤖 Prieten AI',
        description: 'Ai avut 50 de interacțiuni cu asistentul AI!',
        condition: () => this.data.aiInteractions >= 50
      },
      {
        id: 'document_collector',
        title: '📄 Colecționar Documente',
        description: 'Ai încărcat 10 documente!',
        condition: () => this.data.documentsUploaded >= 10
      },
      {
        id: 'week_streak',
        title: '🔥 Streak 7 Zile',
        description: 'Activitate zilnică 7 zile consecutiv!',
        condition: () => this.data.streakDays >= 7
      },
      {
        id: 'level_5',
        title: '🌟 Nivel 5',
        description: 'Ai atins nivelul 5!',
        condition: () => this.data.level >= 5
      },
      {
        id: 'point_collector',
        title: '💰 Colecționar Puncte',
        description: 'Ai acumulat 1000 de puncte!',
        condition: () => this.data.points >= 1000
      }
    ];

    const newAchievements = [];
    achievements.forEach(achievement => {
      if (!this.data.achievements.includes(achievement.id) && achievement.condition()) {
        this.data.achievements.push(achievement.id);
        newAchievements.push(achievement);
        // Bonus points for achievements
        this.data.points += 25;
      }
    });

    return newAchievements;
  }

  /**
   * Check level milestones
   */
  checkLevelMilestones() {
    const milestones = [5, 10, 15, 20];
    if (milestones.includes(this.data.level)) {
      this.checkAchievements('level_milestone');
    }
  }

  /**
   * Update daily streak
   */
  updateDailyStreak() {
    const today = new Date().toDateString();
    const lastDate = this.data.lastActiveDate;

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastDate === yesterday.toDateString()) {
        // Consecutive day
        this.data.streakDays++;
        this.awardPoints('daily_login');
        
        if (this.data.streakDays % 7 === 0) {
          this.awardPoints('streak_bonus');
        }
      } else if (lastDate !== null) {
        // Streak broken
        this.data.streakDays = 1;
        this.awardPoints('daily_login');
      } else {
        // First login
        this.data.streakDays = 1;
        this.awardPoints('daily_login');
      }

      this.data.lastActiveDate = today;
      this.saveGamificationData();
    }
  }

  /**
   * Get current user stats
   */
  getUserStats() {
    return {
      level: this.data.level,
      points: this.data.points,
      experience: this.data.experience,
      experienceToNext: this.data.experienceToNext,
      experienceProgress: (this.data.experience / this.data.experienceToNext) * 100,
      completedSteps: this.data.completedSteps.length,
      completedTasks: this.data.completedTasks.length,
      achievements: this.data.achievements.length,
      streakDays: this.data.streakDays,
      quizStats: this.data.quizStats,
      timeSpent: this.data.timeSpent,
      documentsUploaded: this.data.documentsUploaded,
      aiInteractions: this.data.aiInteractions
    };
  }

  /**
   * Get achievements details
   */
  getAchievements() {
    // Return full achievement objects with progress
    return this.data.achievements.map(id => {
      // This would be populated with full achievement data
      return { id, unlocked: true };
    });
  }

  /**
   * Record time spent in app
   */
  recordTimeSpent(minutes) {
    this.data.timeSpent += minutes;
    this.saveGamificationData();
  }

  /**
   * Record document upload
   */
  recordDocumentUpload() {
    this.data.documentsUploaded++;
    const result = this.awardPoints('upload_document');
    this.checkAchievements('upload_document');
    this.saveGamificationData();
    return result;
  }

  /**
   * Record AI interaction
   */
  recordAIInteraction() {
    this.data.aiInteractions++;
    const result = this.awardPoints('ai_interaction');
    this.checkAchievements('ai_interaction');
    this.saveGamificationData();
    return result;
  }
}

// Create singleton instance
export const gamificationManager = new GamificationManager();
export default gamificationManager;