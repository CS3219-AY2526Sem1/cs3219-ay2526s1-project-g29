/**
 * Statistics Data Management
 * Handles loading, saving, and managing user statistics
 */

import { CONFIG, MOCK_DATA } from "../config.js";
import { StorageManager } from "../utils/storage.js";

export class StatisticsManager {
  /**
   * Get default statistics data
   */
  static getDefaultStats() {
    return MOCK_DATA.questionsCompleted;
  }

  /**
   * Load statistics from local storage
   */
  static loadFromStorage() {
    const savedStats = StorageManager.get(CONFIG.STORAGE_KEYS.USER_STATS);
    return savedStats || null;
  }

  /**
   * Save statistics to local storage
   */
  static saveToStorage(stats) {
    return StorageManager.set(CONFIG.STORAGE_KEYS.USER_STATS, stats);
  }

  /**
   * Load profile statistics with fallback logic
   */
  static load() {
    let stats = this.loadFromStorage();

    if (!stats) {
      // Use default data and save it for future use
      stats = this.getDefaultStats();
      this.saveToStorage(stats);
      console.log("Using default statistics data");
    } else {
      console.log("Loaded statistics from storage");
    }

    return stats;
  }
}

// Backward compatibility function
export function loadProfileData() {
  return StatisticsManager.load();
}
