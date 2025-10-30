// Check username, email and password and whether they meet the criteria

import { config } from "./config.js";

export function validateUsername(username) {
    const { minLength, maxLength, pattern, message } = config.validation.username;

    if (!username || username.length < minLength || username.length > maxLength) {
        return { valid: false, message: message };
    }

    if (!pattern.test(username)) {
        return { valid: false, message: message };
    }

    return { valid: true, message: "" };
}

export function validateEmail(email) {
    const { pattern, message } = config.validation.email;

    if (!email || !pattern.test(email)) {
        return { valid: false, message: message };
    }

    return { valid: true, message: "" };
}

export function validatePassword(password) {
    const { minLength, pattern, message } = config.validation.password;

    if (!password || password.length < minLength) {
        return { valid: false, message: message };
    }

    if (!pattern.test(password)) {
        return { valid: false, message: message };
    }

    return { valid: true, message: "" };
}

export function validatePasswordMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
        return { valid: false, message: "Passwords do not match" };
    }

    return { valid: true, message: "" };
}