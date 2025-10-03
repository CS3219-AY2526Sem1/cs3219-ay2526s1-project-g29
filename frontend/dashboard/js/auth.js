/**
 * Dashboard Authentication Manager
 * Handles user authentication and logout functionality
 */

import { DASHBOARD_CONFIG } from "./config.js";

export class DashboardAuth {
  /**
   * Checks if user is authenticated using HttpOnly cookies and updates UI accordingly
   * Redirects to login if not authenticated
   */
  static async checkUserAuthentication() {
    try {
      // Check session with server using HttpOnly cookie
      const response = await fetch(
        `${DASHBOARD_CONFIG.API.BASE_URL}/auth/verify-token`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include HttpOnly cookie
        }
      );

      if (!response.ok) {
        console.log("User not authenticated, redirecting to login");
        this.redirectToLogin();
        return false;
      }

      // Get user data from localStorage for display
      const userDataString = localStorage.getItem(
        DASHBOARD_CONFIG.STORAGE_KEYS.USER
      );

      if (!userDataString) {
        console.log("No user data found, redirecting to login");
        this.redirectToLogin();
        return false;
      }

      // Parse and display user data
      const userData = JSON.parse(userDataString);
      this.displayUserGreeting(userData);
      console.log("User authenticated with HttpOnly cookie");
      return true;
    } catch (error) {
      console.error("Error checking authentication:", error);
      this.handleAuthenticationError();
      return false;
    }
  }

  /**
   * Displays personalized greeting for authenticated user
   * @param {Object} userData - User data object containing username
   */
  static displayUserGreeting(userData) {
    const greetingElement = document.getElementById(
      DASHBOARD_CONFIG.SELECTORS.USER_GREETING
    );

    if (greetingElement && userData.username) {
      greetingElement.textContent = `Welcome, ${userData.username}!`;
    } else {
      console.error(
        "Unable to display user greeting - missing element or username"
      );
    }
  }

  /**
   * Handles authentication errors by logging out user
   */
  static handleAuthenticationError() {
    console.log("Authentication error detected, logging out user");
    this.logoutUser();
  }

  /**
   * Logs out user by calling logout API and clearing localStorage
   */
  static async logoutUser() {
    try {
      // Call logout API to clear HttpOnly cookie
      await fetch(`${DASHBOARD_CONFIG.API.BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", // Include cookies in request
      });
      console.log("HttpOnly cookie cleared by server");
    } catch (error) {
      console.error("Failed to call logout API:", error);
      // Continue with logout even if API call fails
    }

    // Clear user data from localStorage
    localStorage.removeItem(DASHBOARD_CONFIG.STORAGE_KEYS.USER);

    console.log("User logged out successfully");
    this.redirectToLogin();
  }

  /**
   * Redirects user to login page
   */
  static redirectToLogin() {
    window.location.href = DASHBOARD_CONFIG.ROUTES.LOGIN;
  }
}
