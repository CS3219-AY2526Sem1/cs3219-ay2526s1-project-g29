export function showMessage(message, type = "success") {
  const container = document.getElementById("messageContainer");
  const textEl = document.getElementById("messageText");
  if (!container || !textEl) return;

  textEl.textContent = message;
  textEl.className = `message-text ${type}`;
  container.classList.remove("hidden");
}

export function hideMessage() {
  const container = document.getElementById("messageContainer");
  if (!container) return;
  container.classList.add("hidden");
}

