import { elements } from "./dom-elements.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin() {
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value.trim();

  if (!email) {
    return { error: "Email is required", field: elements.emailInput };
  }

  if (!emailPattern.test(email)) {
    return { error: "Please enter a valid email", field: elements.emailInput };
  }

  if (!password) {
    return { error: "Password is required", field: elements.passwordInput };
  }

  if (password.length < 6) {
    return {
      error: "Password must be at least 6 characters",
      field: elements.passwordInput,
    };
  }

  return { data: { email, password } };
}
