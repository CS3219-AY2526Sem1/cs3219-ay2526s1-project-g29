/**
 * Profile Screen Entry Point
 * Main script that initializes the modular profile application
 */

import { ProfileApplication } from "./app.js";

// ==================== APPLICATION BOOTSTRAP ====================

/**
 * Bootstrap the application when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
  ProfileApplication.initialize();
});
