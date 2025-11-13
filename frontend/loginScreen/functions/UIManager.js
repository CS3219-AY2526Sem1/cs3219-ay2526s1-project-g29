import { config } from "./config.js";
import { elements } from "./elements.js";

export function showLoading() {
    elements.loading.className = "loading-visible";
}

export function hideLoading() {
    elements.loading.className = "loading-hidden";
}

export function showMessage(message, type = "success") {
    elements.messageContainer.textContent = message;
    elements.messageContainer.className = `message-${type}`;

    // Auto-hide after timeout
    setTimeout(clearMessage, config.messageTimeout);
}

export function clearMessage() {
    elements.messageContainer.className = "message-hidden";
}

// Update the sign-in button state based on whether the email and password fields are filled
export function updateSignInButton() {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value.trim();
    const isBothFilled = email && password;

    if (isBothFilled) {
        elements.signInButton.className = "sign-in-btn ready";
    } else {
        elements.signInButton.className = "sign-in-btn default";
    }
}
