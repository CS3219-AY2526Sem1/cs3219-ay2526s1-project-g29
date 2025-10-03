import { config } from "../config.js";
import { elements } from "../utils/dom-elements.js";
import { ui } from "../utils/ui-manager.js";
import { validateLogin } from "../utils/validation.js";
import { login } from "../services/auth-service.js";
import { saveUser } from "../services/data-service.js";

function getErrorMessage(error) {
  const message = error.message.toLowerCase();

  if (message.includes("wrong email") || message.includes("password")) {
    return "Invalid email or password";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Connection error. Please try again.";
  }

  return error.message || "Login failed. Please try again.";
}

export const handlers = {
  async handleLogin(event) {
    event.preventDefault();
    ui.hideMessage();

    const validation = validateLogin();
    if (validation.error) {
      ui.showMessage(validation.error, "error");
      validation.field.focus();
      return;
    }

    const { email, password } = validation.data;

    try {
      ui.showLoading();

      const response = await login(email, password);
      saveUser(response.data);

      ui.showMessage("Login successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = config.routes.dashboard;
      }, config.redirectDelay);
    } catch (error) {
      ui.showMessage(getErrorMessage(error), "error");
    } finally {
      ui.hideLoading();
    }
  },

  handleForgotPassword(event) {
    event.preventDefault();
    ui.showMessage("Password reset will be available soon", "info");
  },

  handleSignUpLink(event) {
    event.preventDefault();
    window.location.href = config.routes.signup;
  },

  handleInputChange() {
    ui.hideMessage();
    ui.updateSignInButton();
  },
};
