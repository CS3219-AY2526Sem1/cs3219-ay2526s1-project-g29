import { elements } from "./elements.js";
import { config } from "./config.js";

export function showMessage(message, type) {
    elements.messageContainer.textContent = message;
    elements.messageContainer.className = `message-${type}`;

    setTimeout(() => {
        elements.messageContainer.className = "message-hidden";
    }, config.messageTimeout);
}

export function showLoading() {
    elements.loadingOverlay.className = "loading-visible";
    elements.signUpButton.disabled = true;
}

export function hideLoading() {
    elements.loadingOverlay.className = "loading-hidden";
    elements.signUpButton.disabled = false;
}

// Update the sign-up button state based on whether all fields are filled
export function updateSignUpButton() {
    const username = elements.usernameInput.value.trim();
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    const confirmPassword = elements.confirmPasswordInput.value;

    const allFieldsFilled = username && email && password && confirmPassword;

    if (allFieldsFilled) {
        elements.signUpButton.className = "sign-up-btn ready";
    } else {
        elements.signUpButton.className = "sign-up-btn default";
    }
}
