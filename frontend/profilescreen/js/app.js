/**
 * Profile Application Controller
 * Main application orchestrator that coordinates all modules
 */

import { AuthManager } from "./managers/auth.js";
import { ProfileDataManager } from "./managers/profile-data.js";
import { StatisticsManager } from "./managers/statistics.js";
import { NavigationManager, UserMenuManager } from "./managers/navigation.js";
import { AnimationManager } from "./managers/animations.js";
import { ProgressChart } from "./components/progress-chart.js";

export class ProfileApplication {
  /**
   * Initialize profile data display
   */
  static async initializeProfileData() {
    console.log("ProfileApplication.initializeProfileData() - Starting...");
    const userData = await AuthManager.checkAuth();
    if (!userData) {
      console.log("No user data - aborting profile initialization");
      return false;
    }

    console.log("User data found, updating profile...");
    ProfileDataManager.update(userData);
    return true;
  }

  /**
   * Initialize statistics and progress chart
   */
  static initializeStatistics() {
    const stats = StatisticsManager.load();
    const chart = new ProgressChart();
    chart.update(stats);
  }

  /**
   * Initialize user interface components
   */
  static initializeUserInterface() {
    NavigationManager.initialize();
    UserMenuManager.initialize();
  }

  /**
   * Main initialization method
   */
  static async initialize() {
    console.log("Initializing PeerPrep Profile page...");

    // Check authentication and load profile data
    const authSuccess = await this.initializeProfileData();
    if (!authSuccess) {
      console.log("Authentication failed, stopping initialization");
      return;
    }

    console.log("Authentication successful, continuing initialization...");

    // Initialize statistics display
    this.initializeStatistics();

    // Initialize UI components
    this.initializeUserInterface();

    // Apply loading animations
    AnimationManager.applyLoadingAnimations();

    console.log("PeerPrep Profile page initialized successfully");
  }
}

// Backward compatibility function
export function initializeProfile() {
  ProfileApplication.initialize();
}
