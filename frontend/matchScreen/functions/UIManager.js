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

// Confirmation Dialog Management
export function showConfirmationDialog(matchData) {
    if (!elements.confirmationDialog) {
        createConfirmationDialog();
    }

    // Update dialog content
    const partnerInfo = elements.confirmationDialog.querySelector('#partnerUsername');
    const matchDetails = elements.confirmationDialog.querySelector('#matchDetails');
    const qualityBadge = elements.confirmationDialog.querySelector('#qualityBadge');

    if (partnerInfo) {
        partnerInfo.textContent = matchData.partnerUsername || matchData.partnerInfo?.username || 'Anonymous';
    }

    if (matchDetails) {
        matchDetails.innerHTML = `
            <p><strong>Topics:</strong> ${matchData.matchedTopics.join(', ')}</p>
            <p><strong>Difficulty:</strong> ${matchData.difficulty}</p>
            <p><strong>Skill Difference:</strong> ${matchData.skillDifference}</p>
        `;
    }

    if (qualityBadge) {
        qualityBadge.textContent = matchData.matchQuality;
        qualityBadge.className = `quality-badge ${matchData.matchQuality}`;
    }

    // Show dialog
    elements.confirmationDialog.classList.remove('hidden');
    elements.confirmationDialog.classList.add('show');

    // Start countdown
    startConfirmationCountdown(matchData.timeToConfirm);
}

export function hideConfirmationDialog() {
    if (elements.confirmationDialog) {
        elements.confirmationDialog.classList.remove('show');
        elements.confirmationDialog.classList.add('hidden');
        stopConfirmationCountdown();
    }
}

export function updateConfirmationDialog(message) {
    if (elements.confirmationDialog) {
        const statusMessage = elements.confirmationDialog.querySelector('#confirmationStatus');
        if (statusMessage) {
            statusMessage.textContent = message;
        }
    }
}

function createConfirmationDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'confirmationDialog';
    dialog.className = 'confirmation-dialog hidden';

    dialog.innerHTML = `
        <div class="confirmation-card">
            <div class="confirmation-header">
                <h2>Match Found!</h2>
                <div id="qualityBadge" class="quality-badge">good</div>
            </div>
            
            <div class="confirmation-content">
                <div class="partner-info">
                    <h3>Partner Information</h3>
                    <p><strong>Username:</strong> <span id="partnerUsername">loading...</span></p>
                    <div id="matchDetails">
                        <!-- Match details will be inserted here -->
                    </div>
                </div>
                
                <div class="confirmation-status">
                    <p id="confirmationStatus">Do you want to start a coding session with this partner?</p>
                    <div class="countdown">
                        <span>Time remaining: </span>
                        <span id="countdownTimer">30</span>
                        <span> seconds</span>
                    </div>
                </div>
                
                <div class="confirmation-actions">
                    <button type="button" class="btn-reject" id="rejectMatchBtn">
                        ❌ Reject
                    </button>
                    <button type="button" class="btn-accept" id="acceptMatchBtn">
                        ✅ Accept
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    dialog.querySelector('#acceptMatchBtn').addEventListener('click', () => {
        import('./eventHandlers.js').then(module => module.handleAcceptMatch());
    });

    dialog.querySelector('#rejectMatchBtn').addEventListener('click', () => {
        import('./eventHandlers.js').then(module => module.handleRejectMatch());
    });

    elements.confirmationDialog = dialog;
}

let countdownInterval;

function startConfirmationCountdown(timeMs) {
    let timeLeft = Math.floor(timeMs / 1000);
    const countdownElement = document.getElementById('countdownTimer');

    if (countdownElement) {
        countdownElement.textContent = timeLeft;

        countdownInterval = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                stopConfirmationCountdown();
            }
        }, 1000);
    }
}

function stopConfirmationCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
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