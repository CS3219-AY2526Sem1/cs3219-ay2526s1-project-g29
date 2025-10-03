import { elements } from "./utils/dom-elements.js";
import { ui } from "./utils/ui-manager.js";
import { handlers } from "./handlers/event-handlers.js";
import { checkSession } from "./services/auth-service.js";
import { config } from "./config.js";

function setupEvents() {
  elements.loginForm.addEventListener("submit", handlers.handleLogin);
  elements.forgotPasswordLink.addEventListener(
    "click",
    handlers.handleForgotPassword
  );
  elements.signUpLink.addEventListener("click", handlers.handleSignUpLink);
  elements.emailInput.addEventListener("input", handlers.handleInputChange);
  elements.passwordInput.addEventListener("input", handlers.handleInputChange);
}

export async function initializeLogin() {
  const session = await checkSession();
  if (session) {
    window.location.href = config.routes.dashboard;
    return;
  }

  setupEvents();
  ui.updateSignInButton();
  elements.emailInput.focus();
}
