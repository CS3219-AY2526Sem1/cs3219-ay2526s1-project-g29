/**
 * Dashboard Configuration
 * Contains all constants and configuration settings
 */

export const DASHBOARD_CONFIG = {
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
