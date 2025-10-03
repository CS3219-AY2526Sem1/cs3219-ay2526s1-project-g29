import { config } from "../config.js";
import { ui } from "../utils/ui-manager.js";
import { validateForm } from "../utils/validation.js";
import {
  registerUser,
  getErrorMessage,
} from "../services/registration-service.js";

export async function handleFormSubmit(e) {
  e.preventDefault();
  ui.hideMessage();

  const result = validateForm();

  if (result.error) {
    ui.showMessage(result.error, "error");
    result.field.focus();
    return;
  }

  try {
    ui.showLoading();

    await registerUser(result.data);

    ui.showMessage(
      `Welcome ${result.data.username}! Redirecting to login...`,
      "success"
    );
    ui.resetForm();

    setTimeout(() => {
      window.location.href = config.loginPath;
    }, config.redirectDelay);
  } catch (error) {
    ui.showMessage(getErrorMessage(error), "error");
  } finally {
    ui.hideLoading();
  }
}
