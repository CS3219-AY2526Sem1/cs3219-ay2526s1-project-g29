// Get DOM elements once when module loads
export const elements = {
  form: document.getElementById("signupForm"),
  username: document.getElementById("username"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  confirmPassword: document.getElementById("confirmPassword"),
  loading: document.getElementById("loadingOverlay"),
  messageBox: document.getElementById("messageContainer"),
  messageText: document.getElementById("messageText"),
};
