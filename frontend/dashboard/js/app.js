/**
 * Dashboard Application Controller
 * Main application orchestrator for the dashboard
 */

import { DASHBOARD_CONFIG } from "./config.js";
import { DashboardAuth } from "./auth.js";
import { FeaturesManager } from "./features.js";

export class DashboardApplication {
  /**
   * Sets up the logout button event listener
   */
  static setupLogoutButton() {
    const logoutButton = document.getElementById(
      DASHBOARD_CONFIG.SELECTORS.LOGOUT_BTN
    );

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        DashboardAuth.logoutUser.bind(DashboardAuth)
      );
      console.log("Logout button initialized");
    } else {
      console.error("Logout button not found");
    }
  }

  /**
   * Initializes the dashboard when DOM is loaded
   */
  static async initialize() {
    console.log("Initializing PeerPrep Dashboard...");

    // Check authentication first
    const isAuthenticated = await DashboardAuth.checkUserAuthentication();
    if (!isAuthenticated) {
      return; // Exit if not authenticated
    }

    // Initialize feature cards
    FeaturesManager.initializeFeatureCards();

    // Setup logout button
    this.setupLogoutButton();

    console.log("PeerPrep Dashboard initialized successfully");
  }
}
