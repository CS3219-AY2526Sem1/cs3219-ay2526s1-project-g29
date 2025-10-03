/**
 * Profile Screen Application
 * Follows software engineering principles: modularity, separation of concerns, single responsibility
 */

// ==================== CONSTANTS & CONFIGURATION ====================

const CONFIG = {
  ROUTES: {
    LOGIN: "../loginscreen/login.html",
    DASHBOARD: "../dashboard/dashboard.html",
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    USER: "user",
    USER_STATS: "userStats",
  },
  PROGRESS_CHART: {
    RADIUS: 90,
    CIRCUMFERENCE: 2 * Math.PI * 90,
  },
  ANIMATIONS: {
    CHART_DELAY: 300,
    LEGEND_DELAY: 600,
    INFO_DELAY: 900,
  },
};

const MOCK_DATA = {
  username: "User11348",
  email: "user11348@example.com",
  memberSince: "2024-01-15",
  questionsCompleted: {
    easy: 6,
    medium: 3,
    hard: 1,
  },
};

// Legacy reference for backward compatibility
const mockProfileData = MOCK_DATA;

// ==================== UTILITY CLASSES ====================

/**
 * Local Storage utility class for consistent data management
 */
class StorageManager {
  static get(key) {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;

      // Special handling for accessToken - it's stored as plain string
      if (key === CONFIG.STORAGE_KEYS.ACCESS_TOKEN) {
        return value; // Return as plain string
      }

      // For other keys, try to parse as JSON
      try {
        return JSON.parse(value);
      } catch (parseError) {
        // If JSON parse fails, return as plain string
        console.warn(
          `Key ${key} is not valid JSON, returning as string:`,
          value
        );
        return value;
      }
    } catch (error) {
      console.error(`Error getting localStorage key ${key}:`, error);
      return null;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting localStorage key ${key}:`, error);
      return false;
    }
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }
}

/**
 * DOM utility class for element manipulation
 */
class DOMUtils {
  static getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id '${id}' not found`);
    }
    return element;
  }

  static updateTextContent(id, content) {
    const element = this.getElementById(id);
    if (element) {
      element.textContent = content;
    }
  }

  static toggleClass(id, className) {
    const element = this.getElementById(id);
    if (element) {
      element.classList.toggle(className);
    }
  }

  static addClass(id, className) {
    const element = this.getElementById(id);
    if (element) {
      element.classList.add(className);
    }
  }

  static removeClass(id, className) {
    const element = this.getElementById(id);
    if (element) {
      element.classList.remove(className);
    }
  }
}

/**
 * Authentication utility class
 */
class AuthManager {
  static async checkAuth() {
    console.log("AuthManager.checkAuth() - Starting authentication check...");

    try {
      // Check session with server
      const response = await fetch("http://localhost:3001/auth/verify-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
        credentials: "include",
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

// ==================== PROFILE DATA MANAGEMENT ====================

/**
 * Profile Data Manager class - handles profile information display and formatting
 */
class ProfileDataManager {
  /**
   * Get display name with fallback logic
   */
  static getDisplayName(userData) {
    return userData.username || userData.displayName || MOCK_DATA.username;
  }

  /**
   * Format date for display
   */
  static formatMemberSinceDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date unavailable";
    }
  }

  /**
   * Update profile title display
   */
  static updateProfileTitle(displayName) {
    DOMUtils.updateTextContent("profileTitle", `${displayName}'s Profile`);
  }

  /**
   * Update basic profile information
   */
  static updateBasicInfo(userData) {
    const username = userData.username || MOCK_DATA.username;
    const email = userData.email || MOCK_DATA.email;

    DOMUtils.updateTextContent("username", username);
    DOMUtils.updateTextContent("email", email);
  }

  /**
   * Update member since date
   */
  static updateMemberSince(userData) {
    const createdAt = userData.createdAt || MOCK_DATA.memberSince;
    const formattedDate = this.formatMemberSinceDate(createdAt);
    DOMUtils.updateTextContent("memberSince", formattedDate);
  }

  /**
   * Main method to update all profile information
   */
  static update(userData) {
    const displayName = this.getDisplayName(userData);

    this.updateProfileTitle(displayName);
    this.updateBasicInfo(userData);
    this.updateMemberSince(userData);
  }
}

// Backward compatibility function
function updateProfileInfo(userData) {
  ProfileDataManager.update(userData);
}

// Update progress chart
// ==================== PROGRESS CHART MANAGEMENT ====================

/**
 * Progress Chart utility class - handles all chart-related calculations and updates
 */
class ProgressChart {
  constructor() {
    this.radius = 90;
    this.circumference = 2 * Math.PI * this.radius;
  }

  /**
   * Calculate progress data for each difficulty level
   */
  calculateProgressData(stats) {
    const { easy, medium, hard } = stats;
    const total = easy + medium + hard;

    if (total === 0) {
      return { easy: 0, medium: 0, hard: 0, total: 0 };
    }

    return {
      easy: {
        count: easy,
        percent: easy / total,
        dash: (easy / total) * this.circumference,
      },
      medium: {
        count: medium,
        percent: medium / total,
        dash: (medium / total) * this.circumference,
      },
      hard: {
        count: hard,
        percent: hard / total,
        dash: (hard / total) * this.circumference,
      },
      total,
    };
  }

  /**
   * Update the numerical displays
   */
  updateCounterDisplays(data) {
    DOMUtils.updateTextContent("totalQuestions", data.total.toString());
    DOMUtils.updateTextContent("easyCount", `${data.easy.count} Easy`);
    DOMUtils.updateTextContent("mediumCount", `${data.medium.count} Medium`);
    DOMUtils.updateTextContent("hardCount", `${data.hard.count} Hard`);
  }

  /**
   * Update individual progress ring with calculated values
   */
  updateProgressRing(elementId, dashLength, dashOffset = 0) {
    const ring = DOMUtils.getElementById(elementId);
    if (!ring) return;

    ring.style.strokeDasharray = `${dashLength} ${this.circumference}`;
    ring.style.strokeDashoffset = dashOffset.toString();
  }

  /**
   * Update all progress rings with proper positioning
   */
  updateProgressRings(data) {
    // Easy questions (starts at top)
    this.updateProgressRing("easyProgress", data.easy.dash, 0);

    // Medium questions (starts after easy)
    this.updateProgressRing(
      "mediumProgress",
      data.medium.dash,
      -data.easy.dash
    );

    // Hard questions (starts after easy + medium)
    this.updateProgressRing(
      "hardProgress",
      data.hard.dash,
      -(data.easy.dash + data.medium.dash)
    );
  }

  /**
   * Main update method - orchestrates the chart update process
   */
  update(stats) {
    const progressData = this.calculateProgressData(stats);

    this.updateCounterDisplays(progressData);

    if (progressData.total > 0) {
      this.updateProgressRings(progressData);
    }

    // Trigger achievements update
    AchievementManager.update(stats);
  }
}

// Backward compatibility function
function updateProgressChart(stats) {
  const chart = new ProgressChart();
  chart.update(stats);
}

// ==================== ACHIEVEMENT MANAGEMENT ====================

/**
 * Achievement Manager class - handles all achievement logic and updates
 */
class AchievementManager {
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
function updateAchievements(stats) {
  AchievementManager.update(stats);
}

// ==================== NAVIGATION MANAGEMENT ====================

/**
 * Navigation Manager class - handles tab navigation and routing
 */
class NavigationManager {
  static TAB_ACTIONS = {
    profileTab: () => {
      // Already on profile page - no action needed
      console.log("Profile tab selected");
    },
    matchTab: () => {
      alert("Match feature coming soon!");
    },
    historyTab: () => {
      alert("History feature coming soon!");
    },
  };

  /**
   * Handle tab click events
   */
  static handleTabClick(event, tab) {
    event.preventDefault();

    this.setActiveTab(tab);
    this.executeTabAction(tab.id);
  }

  /**
   * Set the active tab and remove active class from others
   */
  static setActiveTab(activeTab) {
    const allTabs = document.querySelectorAll(".nav-tab");

    allTabs.forEach((tab) => {
      tab.classList.remove("active");
    });

    activeTab.classList.add("active");
  }

  /**
   * Execute the action associated with a tab
   */
  static executeTabAction(tabId) {
    const action = this.TAB_ACTIONS[tabId];
    if (action) {
      action();
    } else {
      console.warn(`No action defined for tab: ${tabId}`);
    }
  }

  /**
   * Initialize navigation event listeners
   */
  static initialize() {
    const tabs = document.querySelectorAll(".nav-tab");

    tabs.forEach((tab) => {
      tab.addEventListener("click", (event) => {
        this.handleTabClick(event, tab);
      });
    });
  }
}

// Backward compatibility function
function initializeNavigation() {
  NavigationManager.initialize();
}

// ==================== USER INTERFACE MANAGEMENT ====================

/**
 * User Menu Manager class - handles dropdown menu functionality
 */
class UserMenuManager {
  static elements = {
    userAvatar: () => DOMUtils.getElementById("userAvatar"),
    dropdownMenu: () => DOMUtils.getElementById("dropdownMenu"),
    logoutBtn: () => DOMUtils.getElementById("logoutBtn"),
  };

  /**
   * Toggle dropdown menu visibility
   */
  static toggleDropdown(event) {
    event.stopPropagation();
    DOMUtils.toggleClass("dropdownMenu", "show");
  }

  /**
   * Close dropdown menu
   */
  static closeDropdown() {
    DOMUtils.removeClass("dropdownMenu", "show");
  }

  /**
   * Prevent dropdown from closing when clicking inside
   */
  static preventDropdownClose(event) {
    event.stopPropagation();
  }

  /**
   * Handle logout button click
   */
  static handleLogout(event) {
    event.preventDefault();
    AuthManager.logout();
  }

  /**
   * Setup dropdown event listeners
   */
  static setupDropdownEvents() {
    const userAvatar = this.elements.userAvatar();
    const dropdownMenu = this.elements.dropdownMenu();
    const logoutBtn = this.elements.logoutBtn();

    if (userAvatar) {
      userAvatar.addEventListener("click", this.toggleDropdown.bind(this));
    }

    if (dropdownMenu) {
      dropdownMenu.addEventListener(
        "click",
        this.preventDropdownClose.bind(this)
      );
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", this.handleLogout.bind(this));
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", this.closeDropdown.bind(this));
  }

  /**
   * Initialize user menu functionality
   */
  static initialize() {
    this.setupDropdownEvents();
  }
}

// Backward compatibility function
function initializeUserMenu() {
  UserMenuManager.initialize();
}

/**
 * Statistics Data Manager class - handles loading and saving user statistics
 */
class StatisticsManager {
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
function loadProfileData() {
  return StatisticsManager.load();
}

// ==================== APPLICATION INITIALIZATION ====================

/**
 * Animation Manager class - handles loading animations and transitions
 */
class AnimationManager {
  static ANIMATION_TIMINGS = {
    PROGRESS_CHART: 300,
    STATS_LEGEND: 600,
    PROFILE_INFO: 900,
  };

  /**
   * Apply fade-in animation to an element
   */
  static fadeInElement(selector, delay = 0) {
    setTimeout(() => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.opacity = "1";
      }
    }, delay);
  }

  /**
   * Add loading animations with staggered timing
   */
  static applyLoadingAnimations() {
    this.fadeInElement(
      ".progress-chart",
      this.ANIMATION_TIMINGS.PROGRESS_CHART
    );
    this.fadeInElement(".stats-legend", this.ANIMATION_TIMINGS.STATS_LEGEND);
    this.fadeInElement(".profile-info", this.ANIMATION_TIMINGS.PROFILE_INFO);
  }
}

/**
 * Application Controller class - orchestrates the entire profile page initialization
 */
class ProfileApplication {
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

// Backward compatibility functions
function initializeProfile() {
  ProfileApplication.initialize();
}

function addLoadingAnimations() {
  AnimationManager.applyLoadingAnimations();
}

// ==================== APPLICATION BOOTSTRAP ====================

/**
 * Bootstrap the application when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
  ProfileApplication.initialize();
});
