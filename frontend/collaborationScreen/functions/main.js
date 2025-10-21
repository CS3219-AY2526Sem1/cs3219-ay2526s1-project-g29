import { initializeCollaborationScreen } from "./app.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeCollaborationScreen().catch((error) => {
    console.error("Failed to initialize collaboration screen", error);
    const statusEl = document.getElementById("statusText");
    if (statusEl) {
      statusEl.textContent = "Failed to initialize editor. Please refresh the page.";
    }
  });
});
