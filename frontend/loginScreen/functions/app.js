import { config } from "./config.js";
import { checkSession } from "./auth.js";
import {
    updateSignInButton,
} from "./UIManager.js";
import {
    navigateTo,
    setUpEventListeners,
} from "./eventHandlers.js";

async function initialiseLogin() {
    const isSectionActive = await checkSession();

    if (isSectionActive) {
        navigateTo(config.routes.dashboard);
    } else {
        setUpEventListeners();
        updateSignInButton();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseLogin);
} else {
    initialiseLogin();
}
