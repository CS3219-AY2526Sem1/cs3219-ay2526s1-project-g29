import { elements } from "./dom-elements.js";
import { config } from "../config.js";

export const ui = {
  showLoading() {
    elements.loading.style.display = "flex";
  },

  hideLoading() {
    elements.loading.style.display = "none";
  },

  showMessage(text, type = "success") {
    elements.messageText.textContent = text;
    elements.messageText.className = `message-text ${type}`;
    elements.messageBox.style.display = "block";

    setTimeout(() => {
      elements.messageBox.style.display = "none";
    }, config.messageTimeout);
  },

  hideMessage() {
    elements.messageBox.style.display = "none";
  },

  setFieldStyle(field, isValid) {
    if (isValid === null) {
      field.style.borderColor = "";
    } else {
      field.style.borderColor = isValid ? "#48bb78" : "#f56565";
    }
  },

  resetForm() {
    elements.form.reset();
    [
      elements.username,
      elements.email,
      elements.password,
      elements.confirmPassword,
    ].forEach((field) => this.setFieldStyle(field, null));
  },
};
