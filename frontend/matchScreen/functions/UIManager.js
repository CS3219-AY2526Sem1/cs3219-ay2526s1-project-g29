/* filepath: frontend/matchScreen/functions/UIManager.js */
import { elements } from "./elements.js";
import { config } from "./config.js";

// Message Management
export function showMessage(message, type = "info") {
    if (!elements.messageText || !elements.messageContainer) return;
    
    elements.messageText.textContent = message;
    elements.messageText.className = `message-text ${type}`;
    
    // Remove hidden class and add show class
    elements.messageContainer.classList.remove("hidden");
    elements.messageContainer.classList.add("show");

    setTimeout(() => {
        hideMessage();
    }, config.settings.messageTimeout);
}

export function hideMessage() {
    if (!elements.messageContainer) return;
    elements.messageContainer.classList.remove("show");
    elements.messageContainer.classList.add("hidden");
}

// Matching Status Management
export function showMatchingStatus(message = "Searching for peers with similar preferences") {
    if (!elements.statusMessage || !elements.matchingStatus) return;
    
    elements.statusMessage.textContent = message;
    
    // Remove hidden class and add show class
    elements.matchingStatus.classList.remove("hidden");
    elements.matchingStatus.classList.add("show");
    
    // Add pulse animation to status card
    const statusCard = elements.matchingStatus.querySelector(".status-card");
    if (statusCard) {
        statusCard.classList.add("searching");
    }
}

export function hideMatchingStatus() {
    if (!elements.matchingStatus) return;
    
    const statusCard = elements.matchingStatus.querySelector(".status-card");
    if (statusCard) {
        statusCard.classList.remove("searching");
    }
    
    elements.matchingStatus.classList.remove("show");
    elements.matchingStatus.classList.add("hidden");
}

// Form State Management
export function updateFindMatchButton() {
    if (!elements.findMatchBtn) return;
    
    const difficulty = elements.getDifficulty();
    const topics = elements.getTopics();
    const maxTopics = config.settings?.maxTopics || 16;
    
    const isValid = difficulty && topics.length > 0 && topics.length <= maxTopics;
    
    elements.findMatchBtn.disabled = !isValid;
    
    // Update button text based on selection
    if (topics.length > maxTopics) {
        elements.findMatchBtn.textContent = `Too many topics (${topics.length}/${maxTopics})`;
    } else if (isValid) {
        elements.findMatchBtn.textContent = "Find Match";
    } else {
        elements.findMatchBtn.textContent = "Select Options";
    }
}

// Form Validation Feedback
export function showValidationError(field, message) {
    field.classList.add("error");
    field.title = message;
    
    const removeError = () => {
        field.classList.remove("error");
        field.title = "";
        field.removeEventListener("focus", removeError);
        field.removeEventListener("change", removeError);
    };
    
    field.addEventListener("focus", removeError);
    field.addEventListener("change", removeError);
}

export function clearValidationErrors() {
    document.querySelectorAll(".error").forEach(field => {
        field.classList.remove("error");
        field.title = "";
    });
}