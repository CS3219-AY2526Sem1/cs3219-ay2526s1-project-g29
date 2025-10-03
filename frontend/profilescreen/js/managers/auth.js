/**
 * Authentication Management
 * Handles user authentication, session checking, and logout
 */

import { CONFIG } from "../config.js";
import { StorageManager } from "../utils/storage.js";

export class AuthManager {
  static async checkAuth() {
    console.log(
      "AuthManager.checkAuth() - Starting authentication check with HttpOnly cookies..."
    );

    try {
      // Check session with server using HttpOnly cookie
      const response = await fetch("http://localhost:3001/auth/verify-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include HttpOnly cookie
      });

      if (!response.ok) {
        console.log("Authentication failed - waiting 1 second before redirect");
        setTimeout(() => {
          console.log("Now redirecting to login...");
          this.redirectToLogin();
        }, 1000);
        return null;
      }

      // Get user data from localStorage for display
      const user = StorageManager.get(CONFIG.STORAGE_KEYS.USER);

      if (!user) {
        console.log("No user data found - redirecting to login");
        this.redirectToLogin();
        return null;
      }

      console.log("Authentication successful with HttpOnly cookie");
      return user;
    } catch (error) {
      console.error("Error checking authentication:", error);
      setTimeout(() => {
        console.log("Now redirecting to login due to error...");
        this.redirectToLogin();
      }, 1000);
      return null;
    }
  }

  static async logout() {
    try {
      // Call logout API to clear HttpOnly cookie
      await fetch("http://localhost:3001/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies in request
      });
      console.log("HttpOnly cookie cleared by server");
    } catch (error) {
      console.error("Failed to call logout API:", error);
      // Continue with logout even if API call fails
    }

    // Clear user data from localStorage
    StorageManager.remove(CONFIG.STORAGE_KEYS.USER);
    this.redirectToLogin();
  }

  static redirectToLogin() {
    window.location.href = CONFIG.ROUTES.LOGIN;
  }
}
