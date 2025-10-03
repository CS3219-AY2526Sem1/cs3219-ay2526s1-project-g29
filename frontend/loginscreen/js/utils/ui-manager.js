import { elements } from "./dom-elements.js";
import { config } from "../config.js";

export const ui = {
  showLoading() {
    elements.loading.style.display = "flex";
  },

  hideLoading() {
    elements.loading.style.display = "none";
  },

  showMessage(message, type = "success") {
    elements.messageText.textContent = message;
    elements.messageText.className = `message-text ${type}`;
    elements.messageContainer.style.display = "block";

    setTimeout(() => {
      elements.messageContainer.style.display = "none";
    }, config.messageTimeout);
  },

  hideMessage() {
    elements.messageContainer.style.display = "none";
  },

  updateSignInButton() {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value.trim();
    const bothFilled = email && password;

    if (bothFilled) {
      elements.signInButton.style.backgroundColor = "#48bb78";
      elements.signInButton.style.borderColor = "#48bb78";
      elements.signInButton.classList.add("ready");
    } else {
      elements.signInButton.style.backgroundColor = "";
      elements.signInButton.style.borderColor = "";
      elements.signInButton.classList.remove("ready");
    }
  },
};
