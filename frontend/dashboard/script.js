/**
 * PeerPrep Dashboard - Main dashboard functionality
 * Handles user authentication, navigation, and feature card interactions
 */

// ==================== CONSTANTS & CONFIGURATION ====================

const DASHBOARD_CONFIG = {
  API: {
    BASE_URL: "http://localhost:3001",
  },
  ROUTES: {
    LOGIN: "../loginscreen/login.html",
    PROFILE: "../profilescreen/profile.html",
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    USER: "user",
  },
  SELECTORS: {
    USER_GREETING: "userGreeting",
    LOGOUT_BTN: "logoutBtn",
    FEATURE_CARDS: ".feature-card",
  },
  FEATURES: {
    HISTORY: "history",
    MATCH: "match",
  },
};

// ==================== AUTHENTICATION FUNCTIONS ====================

/**
 * Checks if user is authenticated using HttpOnly cookies and updates UI accordingly
 * Redirects to login if not authenticated
 */
async function checkUserAuthentication() {
  try {
    // Check session with server using HttpOnly cookie
    const response = await fetch(
      `${DASHBOARD_CONFIG.API.BASE_URL}/auth/verify-token`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      console.log("User not authenticated, redirecting to login");
      redirectToLogin();
      return false;
    }

    // Get user data from localStorage for display
    const userDataString = localStorage.getItem(
      DASHBOARD_CONFIG.STORAGE_KEYS.USER
    );

    if (!userDataString) {
      console.log("No user data found, redirecting to login");
      redirectToLogin();
      return false;
    }

    // Parse and display user data
    const userData = JSON.parse(userDataString);
    displayUserGreeting(userData);
    console.log("User authenticated successfully");
    return true;
  } catch (error) {
    console.error("Error checking authentication:", error);
    handleAuthenticationError();
    return false;
  }
}

/**
 * Displays personalized greeting for authenticated user
 * @param {Object} userData - User data object containing username
 */
function displayUserGreeting(userData) {
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
function handleAuthenticationError() {
  console.log("Authentication error detected, logging out user");
  logoutUser();
}

/**
 * Logs out user by calling logout API and clearing localStorage
 */
async function logoutUser() {
  try {
    // Call logout API to clear HttpOnly cookie
    await fetch(`${DASHBOARD_CONFIG.API.BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    console.log("HttpOnly cookie cleared by server");
  } catch (error) {
    console.error("Failed to call logout API:", error);
    // Continue with logout even if API call fails
  }

  // Clear user data from localStorage
  localStorage.removeItem(DASHBOARD_CONFIG.STORAGE_KEYS.USER);

  console.log("User logged out successfully");
  redirectToLogin();
}

/**
 * Redirects user to login page
 */
function redirectToLogin() {
  window.location.href = DASHBOARD_CONFIG.ROUTES.LOGIN;
}

// ==================== FEATURE CARD FUNCTIONS ====================

/**
 * Initializes click handlers for all feature cards
 */
function initializeFeatureCards() {
  const featureCards = document.querySelectorAll(
    DASHBOARD_CONFIG.SELECTORS.FEATURE_CARDS
  );

  if (featureCards.length === 0) {
    console.warn("No feature cards found on the page");
    return;
  }

  featureCards.forEach((card, index) => {
    card.addEventListener("click", () => handleFeatureCardClick(card));
    console.log(`Feature card ${index + 1} initialized`);
  });

  console.log(`Successfully initialized ${featureCards.length} feature cards`);
}

/**
 * Handles click events on feature cards
 * @param {HTMLElement} card - The clicked feature card element
 */
function handleFeatureCardClick(card) {
  const featureType = card.dataset.feature;

  if (!featureType) {
    console.error("Feature card missing data-feature attribute");
    showFeatureComingSoon("Unknown Feature");
    return;
  }

  console.log(`Feature card clicked: ${featureType}`);

  switch (featureType) {
    case DASHBOARD_CONFIG.FEATURES.HISTORY:
      handleHistoryFeature();
      break;

    case DASHBOARD_CONFIG.FEATURES.MATCH:
      handleMatchFeature();
      break;

    default:
      console.warn(`Unknown feature type: ${featureType}`);
      showFeatureComingSoon(featureType);
  }
}

/**
 * Handles History feature activation
 */
function handleHistoryFeature() {
  console.log("History feature requested");
  showFeatureComingSoon("History");
  // TODO: Implement navigation to history page
  // window.location.href = "../historyscreen/history.html";
}

/**
 * Handles Match feature activation
 */
function handleMatchFeature() {
  console.log("Match feature requested");
  showFeatureComingSoon("Matching Service");
  // TODO: Implement navigation to match page
  // window.location.href = "../matchscreen/match.html";
}

/**
 * Shows coming soon message for features
 * @param {string} featureName - Name of the feature
 */
function showFeatureComingSoon(featureName) {
  alert(`${featureName} feature coming soon!`);
}

// ==================== EVENT LISTENERS & INITIALIZATION ====================

/**
 * Initializes the dashboard when DOM is loaded
 */
async function initializeDashboard() {
  console.log("Initializing PeerPrep Dashboard...");

  // Check authentication first
  const isAuthenticated = await checkUserAuthentication();
  if (!isAuthenticated) {
    return; // Exit if not authenticated
  }

  // Initialize feature cards
  initializeFeatureCards();

  // Setup logout button
  setupLogoutButton();

  console.log("PeerPrep Dashboard initialized successfully");
}

/**
 * Sets up the logout button event listener
 */
function setupLogoutButton() {
  const logoutButton = document.getElementById(
    DASHBOARD_CONFIG.SELECTORS.LOGOUT_BTN
  );

  if (logoutButton) {
    logoutButton.addEventListener("click", logoutUser);
    console.log("Logout button initialized");
  } else {
    console.error("Logout button not found");
  }
}

// ==================== MAIN APPLICATION ENTRY POINT ====================

// Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", initializeDashboard);
