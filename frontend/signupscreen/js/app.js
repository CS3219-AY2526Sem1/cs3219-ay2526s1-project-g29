import { elements } from "./utils/dom-elements.js";
import { handleFormSubmit } from "./handlers/event-handlers.js";
import { setupLiveValidation } from "./handlers/real-time-validator.js";

export function initSignup() {
  elements.form.addEventListener("submit", handleFormSubmit);
  setupLiveValidation();
  elements.username.focus();
}
