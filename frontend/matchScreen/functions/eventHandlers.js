import { elements } from "./elements.js";
import { config } from "./config.js";
import { logout } from "./auth.js";
import { requestMatch, cancelMatch } from "./matching.js";
import { connectWebSocket, disconnectWebSocket } from "./websocket.js";
import { showMessage, showMatchingStatus, hideMatchingStatus, updateFindMatchButton } from "./UIManager.js";

// User Session State
let currentUser = null;
let matchRequestActive = false;

export function setUserData(userId, profile) {
    currentUser = { userId, profile };
}

// Navigation
function navigateTo(url) {
    window.location.href = url;
}

// Form Validation
function validateForm() {
    const difficulty = elements.getDifficulty();
    const topics = elements.getTopics();
    
    if (!difficulty) {
        return { valid: false, error: "Please select a difficulty level" };
    }
    
    if (topics.length === 0) {
        return { valid: false, error: "Please select at least one topic" };
    }
    
    if (topics.length > config.settings.maxTopics) {
        return { valid: false, error: `Please select no more than ${config.settings.maxTopics} topics` };
    }
    
    return { valid: true, data: { difficulty, topics } };
}

// Match Request Handler
export async function handleFindMatch(event) {
    event.preventDefault();
    
    // Validate form
    const validation = validateForm();
    if (!validation.valid) {
        showMessage(validation.error, "error");
        return;
    }
    
    // Check user session
    if (!currentUser) {
        showMessage("User session not found. Please log in again.", "error");
        setTimeout(() => navigateTo(config.routes.login), 2000);
        return;
    }
    
    const { difficulty, topics } = validation.data;
    
    try {
        // Set loading state
        elements.setFormState(true);
        matchRequestActive = true;
        
        // Connect WebSocket
        await connectWebSocket(currentUser.userId, handleWebSocketMessage);
        
        // Send match request
        await requestMatch(
            currentUser.userId,
            topics,
            difficulty,
            currentUser.profile.questionStats || { easy: 0, medium: 0, hard: 0 }
        );
        
        showMatchingStatus();
        console.log("Match request sent successfully");
        
    } catch (error) {
        console.error("Error requesting match:", error);
        showMessage(error.message || "Failed to start matching", "error");
        resetMatchState();
    }
}

// Cancel Match Handler
export async function handleCancelMatch() {
    if (!currentUser) return;
    
    try {
        await cancelMatch(currentUser.userId);
        resetMatchState();
        showMessage("Match search cancelled", "info");
        
    } catch (error) {
        console.error("Error cancelling match:", error);
        showMessage("Failed to cancel match search", "error");
    }
}

// Navigation Handlers
export function handleCancel() {
    navigateTo(config.routes.dashboard);
}

export async function handleLogout() {
    try {
        if (matchRequestActive) {
            await handleCancelMatch();
        }
        await logout();
        navigateTo(config.routes.login);
    } catch (error) {
        console.error("Logout error:", error);
        navigateTo(config.routes.login);
    }
}

// WebSocket Message Handler
function handleWebSocketMessage(data) {
    console.log("WebSocket message received:", data);
    
    switch (data.type) {
        case "REGISTERED":
            console.log(`Registered with userId: ${data.userId}`);
            break;
            
        case "MATCHED":
            handleMatchSuccess(data);
            break;
            
        case "MATCH_TIMEOUT":
            handleMatchTimeout();
            break;
            
        case "CANCELLED":
            resetMatchState();
            break;
            
        default:
            console.log("Unknown message type:", data.type);
    }
}

// Match Success Handler
function handleMatchSuccess(data) {
    resetMatchState();
    
    showMessage("Match found! Redirecting to collaboration...", "success");
    
    // Store match data for collaboration screen
    sessionStorage.setItem("currentMatch", JSON.stringify({
        sessionId: data.sessionId,
        partnerId: data.partnerId,
        matchedTopics: data.matchedTopics,
        difficulty: data.difficulty,
    }));
    
    // Redirect to collaboration screen with sessionId
    setTimeout(() => {
        const url = `${config.routes.collaboration}?sessionId=${encodeURIComponent(data.sessionId)}`;
        navigateTo(url);
    }, 1500);
}

// Match Timeout Handler
function handleMatchTimeout() {
    resetMatchState();
    showMessage("No match found. Please try again.", "error");
}

// Reset Match State
function resetMatchState() {
    hideMatchingStatus();
    disconnectWebSocket();
    matchRequestActive = false;
    elements.setFormState(false);
    updateFindMatchButton();
}

// Dropdown Menu Setup
export function setupDropdownMenu() {
    if (!elements.userAvatar || !elements.dropdownMenu) return;
    
    // Toggle dropdown
    elements.userAvatar.addEventListener("click", (e) => {
        e.stopPropagation();
        elements.dropdownMenu.classList.toggle("show");
    });
    
    // Close on outside click
    document.addEventListener("click", (e) => {
        if (!elements.userAvatar.contains(e.target) && !elements.dropdownMenu.contains(e.target)) {
            elements.dropdownMenu.classList.remove("show");
        }
    });
    
    // Close on escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            elements.dropdownMenu.classList.remove("show");
        }
    });
    
    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await handleLogout();
        });
    }
}

// Form Event Listeners
export function setupFormListeners() {
    // Ensure overlays are hidden on initialization
    hideMatchingStatus();
    
    // Form submission
    elements.matchForm.addEventListener("submit", handleFindMatch);
    
    // Button clicks
    elements.cancelBtn.addEventListener("click", handleCancel);
    elements.cancelMatchBtn.addEventListener("click", handleCancelMatch);
    
    // Form state updates
    elements.getAllDifficultyInputs().forEach(input => {
        input.addEventListener("change", updateFindMatchButton);
    });
    
    elements.getAllTopicInputs().forEach(input => {
        input.addEventListener("change", updateFindMatchButton);
    });
    
    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
        if (matchRequestActive) {
            disconnectWebSocket();
        }
    });
}
