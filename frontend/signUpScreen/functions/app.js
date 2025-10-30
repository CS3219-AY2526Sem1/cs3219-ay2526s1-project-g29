import { setupEventListeners } from "./eventHandlers.js";

function initializeSignup() {
    setupEventListeners();
}

// Load when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSignup);
} else {
    initializeSignup();
}
