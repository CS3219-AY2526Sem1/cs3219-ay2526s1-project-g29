/**
 * Dashboard Entry Point
 * Main script that initializes the modular dashboard application
 */

import { DashboardApplication } from "./app.js";

// Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  DashboardApplication.initialize();
});
