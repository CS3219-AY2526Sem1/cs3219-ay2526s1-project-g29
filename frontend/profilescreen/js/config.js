/**
 * Profile Screen Configuration
 * Contains all constants, routes, and configuration settings
 */

export const CONFIG = {
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

export const MOCK_DATA = {
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
export const mockProfileData = MOCK_DATA;
