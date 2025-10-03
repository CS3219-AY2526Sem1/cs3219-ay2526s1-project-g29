import { config } from "../config.js";
import { elements } from "./dom-elements.js";

// Simple validation functions
export const validate = {
  email: (email) => config.email.pattern.test(email),

  username: (username) => {
    if (username.length < config.username.minLength) return false;
    if (username.length > config.username.maxLength) return false;
    return config.username.pattern.test(username);
  },

  password: (password) => {
    if (password.length < config.password.minLength) return false;
    return config.password.pattern.test(password);
  },
};

// Get form data and validate it
export function validateForm() {
  const data = {
    username: elements.username.value.trim(),
    email: elements.email.value.trim(),
    password: elements.password.value.trim(),
    confirmPassword: elements.confirmPassword.value.trim(),
  };

  // Check required fields
  if (!data.username)
    return { error: "Username is required", field: elements.username };
  if (!data.email) return { error: "Email is required", field: elements.email };
  if (!data.password)
    return { error: "Password is required", field: elements.password };
  if (!data.confirmPassword)
    return {
      error: "Please confirm your password",
      field: elements.confirmPassword,
    };

  // Validate username
  if (data.username.length < config.username.minLength) {
    return {
      error: `Username must be at least ${config.username.minLength} characters`,
      field: elements.username,
    };
  }
  if (data.username.length > config.username.maxLength) {
    return {
      error: `Username must be less than ${config.username.maxLength} characters`,
      field: elements.username,
    };
  }
  if (!validate.username(data.username)) {
    return {
      error: "Username can only contain letters, numbers, and underscores",
      field: elements.username,
    };
  }

  // Validate email
  if (!validate.email(data.email)) {
    return {
      error: "Please enter a valid email address",
      field: elements.email,
    };
  }

  // Validate password
  if (!validate.password(data.password)) {
    return {
      error: "Password must be at least 6 characters with a letter and number",
      field: elements.password,
    };
  }

  // Check password match
  if (data.password !== data.confirmPassword) {
    return { error: "Passwords do not match", field: elements.confirmPassword };
  }

  return { data };
}
