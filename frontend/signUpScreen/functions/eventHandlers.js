import { config } from "./config.js";
import { elements } from "./elements.js";
import { signupUser } from "./auth.js";
import {
    validateUsername,
    validateEmail,
    validatePassword,
    validatePasswordMatch,
} from "./validation.js";
import {
    showMessage,
    showLoading,
    hideLoading,
    updateSignUpButton,
} from "./UIManager.js";

function validateForm() {
    const username = elements.usernameInput.value.trim();
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    const confirmPassword = elements.confirmPasswordInput.value;

    // Validate each field
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        return usernameValidation;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        return emailValidation;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return passwordValidation;
    }

    const passwordMatchValidation = validatePasswordMatch(
        password,
        confirmPassword
    );
    if (!passwordMatchValidation.valid) {
        return passwordMatchValidation;
    }

    return { valid: true, data: { username, email, password } };
}

function navigateTo(url) {
    window.location.href = url;
}

async function handleSignup(event) {
    event.preventDefault();

    const validation = validateForm();
    if (!validation.valid) {
        showMessage(validation.message, "error");
        return;
    }

    const { username, email, password } = validation.data;

    try {
        showLoading();

        await signupUser(username, email, password);

        showMessage(
            "Account created successfully! Redirecting to login...",
            "success"
        );

        setTimeout(() => {
            navigateTo(config.routes.login);
        }, config.redirectDelay);
    } catch (error) {
        console.error("Signup error:", error.message);
        showMessage(error.message, "error");
    } finally {
        hideLoading();
    }
}

function handleInputValidation(event) {
    const field = event.target;
    const fieldName = field.name;
    const value = field.value.trim();

    // Remove any existing error styling
    field.classList.remove("error");

    // Validate based on field type
    let validation;
    switch (fieldName) {
        case "username":
            validation = validateUsername(value);
            break;
        case "email":
            validation = validateEmail(value);
            break;
        case "password":
            validation = validatePassword(value);
            break;
        case "confirmPassword":
            const password = elements.passwordInput.value;
            validation = validatePasswordMatch(password, value);
            break;
        default:
            return;
    }

    // Display validation error
    if (!validation.valid && value.length > 0) {
        field.classList.add("error");
        field.title = validation.message;
    } else {
        field.title = "";
    }

    updateSignUpButton();
}

export function setupEventListeners() {
    elements.signupForm.addEventListener("submit", handleSignup);

    // Validation on blur (when user leaves field)
    elements.usernameInput.addEventListener("blur", handleInputValidation);
    elements.emailInput.addEventListener("blur", handleInputValidation);
    elements.passwordInput.addEventListener("blur", handleInputValidation);
    elements.confirmPasswordInput.addEventListener("blur", handleInputValidation);

    // Update button state on input
    elements.usernameInput.addEventListener("input", updateSignUpButton);
    elements.emailInput.addEventListener("input", updateSignUpButton);
    elements.passwordInput.addEventListener("input", updateSignUpButton);
    elements.confirmPasswordInput.addEventListener("input", updateSignUpButton);

    updateSignUpButton();
}