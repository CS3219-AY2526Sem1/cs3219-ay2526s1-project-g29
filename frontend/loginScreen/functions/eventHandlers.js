import { config } from "./config.js";
import { login } from "./auth.js";
import { elements } from "./elements.js";
import {
    showMessage,
    showLoading,
    hideLoading,
    clearMessage,
    updateSignInButton,
} from "./UIManager.js";

export function navigateTo(url) {
    window.location.href = url;
}

export async function handleLoginButton(event) {
    event.preventDefault();
    clearMessage();

    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value.trim();

    try {
        showLoading();

        await login(email, password);

        showMessage("Login successful! Redirecting...", "success");

        setTimeout(() => {
            navigateTo(config.routes.dashboard);
        }, config.redirectDelay);
    } catch (error) {
        showMessage("Login failed. Please check your credentials.", "error");
    } finally {
        hideLoading();
    }
}

export function handleSignUpButton(event) {
    event.preventDefault();
    navigateTo(config.routes.signup);
}

export function handleInputChange() {
    clearMessage();
    updateSignInButton();
}

export function setUpEventListeners() {
    elements.loginForm.addEventListener("submit", handleLoginButton);
    elements.signUpLink.addEventListener("click", handleSignUpButton);
    elements.emailInput.addEventListener("input", handleInputChange);
    elements.passwordInput.addEventListener("input", handleInputChange);
}