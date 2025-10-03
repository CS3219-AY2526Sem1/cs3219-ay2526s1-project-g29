/**
 * Achievement Management
 * Handles all achievement logic, rules, and updates
 */

import { DOMUtils } from "../utils/dom.js";

export class AchievementManager {
  static ACHIEVEMENT_RULES = {
    firstQuestion: {
      id: "firstQuestion",
      check: (stats) => this.getTotalQuestions(stats) >= 1,
      description: "First Question completed",
    },
    tenQuestions: {
      id: "tenQuestions",
      check: (stats) => this.getTotalQuestions(stats) >= 10,
      description: "10 Questions completed",
    },
    allDifficulties: {
      id: "allDifficulties",
      check: (stats) => stats.easy > 0 && stats.medium > 0 && stats.hard > 0,
      description: "All difficulty levels attempted",
    },
    streak7: {
      id: "streak7",
      check: (stats) => this.getTotalQuestions(stats) >= 7, // Mock implementation
      description: "7-day streak maintained",
    },
  };

  /**
   * Calculate total questions from stats
   */
  static getTotalQuestions(stats) {
    return stats.easy + stats.medium + stats.hard;
  }

  /**
   * Check if a specific achievement should be unlocked
   */
  static checkAchievement(achievement, stats) {
    return achievement.check(stats);
  }

  /**
   * Unlock an achievement by adding the unlocked class
   */
  static unlockAchievement(achievementId) {
    DOMUtils.addClass(achievementId, "unlocked");
  }

  /**
   * Process all achievements and unlock qualifying ones
   */
  static processAchievements(stats) {
    Object.values(this.ACHIEVEMENT_RULES).forEach((achievement) => {
      if (this.checkAchievement(achievement, stats)) {
        this.unlockAchievement(achievement.id);
      }
    });
  }

  /**
   * Main update method for achievements
   */
  static update(stats) {
    this.processAchievements(stats);
  }
}

// Backward compatibility function
export function updateAchievements(stats) {
  AchievementManager.update(stats);
}
