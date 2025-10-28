import { checkSession, getUserProfile } from "./auth.js";
import { config } from "./config.js";
import { setupDropdownMenu, setupFormListeners, setUserData } from "./eventHandlers.js";
import { showMessage, updateFindMatchButton } from "./UIManager.js";
import { elements } from "./elements.js";

function navigateTo(url) {
    window.location.href = url;
}

async function initializeMatchScreen() {
    try {
        console.log("Initializing match screen...");

        // Check user authentication
        const sessionData = await checkSession();
        if (!sessionData) {
            console.log("No valid session, redirecting to login");
            navigateTo(config.routes.login);
            return;
        }

        // Get user profile data
        const profileData = await getUserProfile();
        if (!profileData) {
            showMessage("Failed to load profile data", "error");
            setTimeout(() => navigateTo(config.routes.login), 2000);
            return;
        }

        // Initialize application state
        setUserData(sessionData.data.id, profileData);

        // Setup event listeners
        setupDropdownMenu();
        setupFormListeners();

        elements.initSelectAll();

        // Initialize UI state
        updateFindMatchButton();

        console.log("Match screen initialized successfully");

    } catch (error) {
        console.error("Error initializing match screen:", error);
        showMessage("An error occurred. Please try again.", "error");
    }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMatchScreen);
} else {
    initializeMatchScreen();
}