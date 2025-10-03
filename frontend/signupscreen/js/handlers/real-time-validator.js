import { elements } from "../utils/dom-elements.js";
import { ui } from "../utils/ui-manager.js";
import { validate } from "../utils/validation.js";

export function setupLiveValidation() {
  // Username validation
  elements.username.addEventListener("input", () => {
    ui.hideMessage();
    const value = elements.username.value.trim();

    if (!value) {
      ui.setFieldStyle(elements.username, null);
    } else {
      ui.setFieldStyle(elements.username, validate.username(value));
    }
  });

  // Email validation
  elements.email.addEventListener("input", () => {
    ui.hideMessage();
    const value = elements.email.value.trim();

    if (!value) {
      ui.setFieldStyle(elements.email, null);
    } else {
      ui.setFieldStyle(elements.email, validate.email(value));
    }
  });

  // Password validation
  elements.password.addEventListener("input", () => {
    ui.hideMessage();
    const value = elements.password.value.trim();

    if (!value) {
      ui.setFieldStyle(elements.password, null);
    } else {
      ui.setFieldStyle(elements.password, validate.password(value));
    }

    // Re-check confirm password if it has a value
    checkPasswordMatch();
  });

  // Confirm password validation
  elements.confirmPassword.addEventListener("input", () => {
    ui.hideMessage();
    checkPasswordMatch();
  });
}

function checkPasswordMatch() {
  const password = elements.password.value.trim();
  const confirm = elements.confirmPassword.value.trim();

  if (!confirm) {
    ui.setFieldStyle(elements.confirmPassword, null);
  } else {
    ui.setFieldStyle(elements.confirmPassword, password === confirm);
  }
}
