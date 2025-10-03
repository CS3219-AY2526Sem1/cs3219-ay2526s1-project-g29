/**
 * PeerPrep Login Screen - User authentication functionality
 * Handles user login, form validation, and session management
 */

// ==================== CONSTANTS & CONFIGURATION ====================

const LOGIN_CONFIG = {
  API: {
    BASE_URL: (() => {
      // Environment-aware API URL configuration
      if (
        window.location.hostname === "localhost" &&
        window.location.port === "3000"
      ) {
        return "http://localhost:3001"; // Docker host port mapping
      }
      return "http://localhost:3001"; // Default fallback
    })(),
    ENDPOINTS: {
      LOGIN: "/auth/login",
    },
  },
  ROUTES: {
    DASHBOARD: "../dashboard/dashboard.html",
    PROFILE: "../profilescreen/profile.html",
    SIGNUP: "../signupscreen/signup.html",
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    USER: "user",
  },
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 6,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  UI: {
    MESSAGE_DISPLAY_TIME: 5000,
    REDIRECT_DELAY: 2000,
  },
};

// ==================== DOM ELEMENTS ====================

const DOM_ELEMENTS = {
  loginForm: document.getElementById("loginForm"),
  emailInput: document.getElementById("email"),
  passwordInput: document.getElementById("password"),
  signInButton: document.querySelector(".sign-in-btn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  messageContainer: document.getElementById("messageContainer"),
  messageText: document.getElementById("messageText"),
  forgotPasswordLink: document.getElementById("forgotPasswordLink"),
  signUpLink: document.getElementById("signUpLink"),
};

// ==================== UI UTILITY FUNCTIONS ====================

/**
 * Shows the loading overlay
 */
function showLoadingSpinner() {
  DOM_ELEMENTS.loadingOverlay.style.display = "flex";
}

/**
 * Hides the loading overlay
 */
function hideLoadingSpinner() {
  DOM_ELEMENTS.loadingOverlay.style.display = "none";
}

/**
 * Displays a message to the user
 * @param {string} message - The message to display
 * @param {string} type - Message type: 'success' or 'error'
 */
function showUserMessage(message, type = "success") {
  DOM_ELEMENTS.messageText.textContent = message;
  DOM_ELEMENTS.messageText.className = `message-text ${type}`;
  DOM_ELEMENTS.messageContainer.style.display = "block";

  // Auto-hide message after specified time
  setTimeout(() => {
    DOM_ELEMENTS.messageContainer.style.display = "none";
  }, LOGIN_CONFIG.UI.MESSAGE_DISPLAY_TIME);
}

/**
 * Hides any currently displayed message
 */
function hideUserMessage() {
  DOM_ELEMENTS.messageContainer.style.display = "none";
}

// ==================== FORM VALIDATION FUNCTIONS ====================

/**
 * Validates email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
function isValidEmail(email) {
  return LOGIN_CONFIG.VALIDATION.EMAIL_REGEX.test(email);
}

/**
 * Validates the login form inputs
 * @returns {Object} Validation result with isValid boolean and data object
 */
function validateLoginForm() {
  const email = DOM_ELEMENTS.emailInput.value.trim();
  const password = DOM_ELEMENTS.passwordInput.value.trim();

  // Email validation
  if (!email) {
    showUserMessage("Please enter your email address", "error");
    DOM_ELEMENTS.emailInput.focus();
    return { isValid: false };
  }

  if (!isValidEmail(email)) {
    showUserMessage("Please enter a valid email address", "error");
    DOM_ELEMENTS.emailInput.focus();
    return { isValid: false };
  }

  // Password validation
  if (!password) {
    showUserMessage("Please enter your password", "error");
    DOM_ELEMENTS.passwordInput.focus();
    return { isValid: false };
  }

  if (password.length < LOGIN_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
    showUserMessage(
      `Password must be at least ${LOGIN_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`,
      "error"
    );
    DOM_ELEMENTS.passwordInput.focus();
    return { isValid: false };
  }

  return {
    isValid: true,
    data: { email, password },
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Authenticates user with the backend API
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} Login response data
 * @throws {Error} If login fails or network error occurs
 */
async function authenticateUser(email, password) {
  try {
    console.log("Attempting user authentication...");

    const response = await fetch(
      `${LOGIN_CONFIG.API.BASE_URL}${LOGIN_CONFIG.API.ENDPOINTS.LOGIN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Authentication failed");
    }

    console.log("User authentication successful");
    return responseData;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

// ==================== LOCAL STORAGE FUNCTIONS ====================

/**
 * Saves user authentication data to localStorage
 * @param {Object} userData - User data from successful login
 */
function saveUserData(userData) {
  console.log("Saving user data...");

  try {
    // Save user info (excluding sensitive data)
    const userInfo = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      isAdmin: userData.isAdmin,
      createdAt: userData.createdAt,
    };

    localStorage.setItem(
      LOGIN_CONFIG.STORAGE_KEYS.USER,
      JSON.stringify(userInfo)
    );

    // Verify data was saved correctly
    const userSaved = !!localStorage.getItem(LOGIN_CONFIG.STORAGE_KEYS.USER);

    console.log("User data saved successfully");
    console.log(`User info saved: ${userSaved ? "Yes" : "No"}`);
    console.log("Access token saved in HttpOnly cookie by server");

    return userSaved;
  } catch (error) {
    console.error("Error saving user data:", error);
    return false;
  }
}

/**
 * Clears all user authentication data
 */
async function clearUserAuthenticationData() {
  console.log("Clearing user authentication data...");

  try {
    // Call logout API to clear HttpOnly cookie
    await fetch(`${LOGIN_CONFIG.API.BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    console.log("HttpOnly cookie cleared by server");
  } catch (error) {
    console.error("Failed to call logout API:", error);
    // Continue with localStorage cleanup even if API call fails
  }

  // Clear user data from localStorage
  localStorage.removeItem(LOGIN_CONFIG.STORAGE_KEYS.USER);

  console.log("User data cleared successfully");
}

// ==================== EVENT HANDLERS ====================

/**
 * Handles the login form submission
 * @param {Event} event - Form submit event
 */
async function handleLoginFormSubmission(event) {
  event.preventDefault();
  hideUserMessage();

  // Validate form inputs
  const validation = validateLoginForm();
  if (!validation.isValid) {
    return;
  }

  const { email, password } = validation.data;

  try {
    showLoadingSpinner();

    // Authenticate with backend
    const authResponse = await authenticateUser(email, password);

    // Save user data
    const dataSaved = saveUserData(authResponse.data);
    if (!dataSaved) {
      throw new Error("Failed to save authentication data");
    }

    // Show success message
    showUserMessage("Login successful! Redirecting to dashboard...", "success");

    // Redirect to dashboard page after delay
    setTimeout(() => {
      console.log("Redirecting to dashboard page...");
      redirectToDashboard();
    }, LOGIN_CONFIG.UI.REDIRECT_DELAY);
  } catch (error) {
    const errorMessage = getLoginErrorMessage(error);
    showUserMessage(errorMessage, "error");
  } finally {
    hideLoadingSpinner();
  }
}

/**
 * Gets appropriate error message based on error type
 * @param {Error} error - The error that occurred
 * @returns {string} User-friendly error message
 */
function getLoginErrorMessage(error) {
  if (error.message.includes("Wrong email and/or password")) {
    return "Invalid email or password. Please check your credentials.";
  } else if (
    error.message.includes("network") ||
    error.message.includes("fetch")
  ) {
    return "Unable to connect to server. Please check your connection.";
  } else if (error.message) {
    return error.message;
  }
  return "Login failed. Please try again.";
}

/**
 * Redirects user to dashboard page
 */
function redirectToDashboard() {
  const tokenExists = !!localStorage.getItem(
    LOGIN_CONFIG.STORAGE_KEYS.ACCESS_TOKEN
  );
  const userExists = !!localStorage.getItem(LOGIN_CONFIG.STORAGE_KEYS.USER);

  console.log(`Token stored: ${tokenExists ? "Yes" : "No"}`);
  console.log(`User stored: ${userExists ? "Yes" : "No"}`);

  window.location.href = LOGIN_CONFIG.ROUTES.DASHBOARD;
}

/**
 * Handles forgot password link click
 * @param {Event} event - Click event
 */
function handleForgotPasswordClick(event) {
  event.preventDefault();
  showUserMessage(
    "Forgot password functionality will be implemented soon",
    "error"
  );
}

/**
 * Handles sign up link click
 * @param {Event} event - Click event
 */
function handleSignUpLinkClick(event) {
  event.preventDefault();
  window.location.href = LOGIN_CONFIG.ROUTES.SIGNUP;
}

/**
 * Handles input field changes to hide error messages and update button state
 */
function handleInputFieldChange() {
  hideUserMessage();
  updateSignInButtonState();
}

/**
 * Updates the sign-in button color based on form completion
 */
function updateSignInButtonState() {
  const email = DOM_ELEMENTS.emailInput.value.trim();
  const password = DOM_ELEMENTS.passwordInput.value.trim();

  // Check if both fields have content
  const bothFieldsFilled = email.length > 0 && password.length > 0;

  if (bothFieldsFilled) {
    // Change button to green when both fields are filled
    DOM_ELEMENTS.signInButton.style.backgroundColor = "#48bb78";
    DOM_ELEMENTS.signInButton.style.borderColor = "#48bb78";
    DOM_ELEMENTS.signInButton.classList.add("ready");
  } else {
    // Reset to default styling when fields are empty
    DOM_ELEMENTS.signInButton.style.backgroundColor = "";
    DOM_ELEMENTS.signInButton.style.borderColor = "";
    DOM_ELEMENTS.signInButton.classList.remove("ready");
  }
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Checks if user already has a valid session by verifying with server
 * Redirects to profile if valid session exists
 */
async function checkExistingUserSession() {
  console.log("Checking for existing user session...");

  try {
    // Check if server recognizes our HttpOnly cookie
    const response = await fetch(
      `${LOGIN_CONFIG.API.BASE_URL}/auth/verify-token`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Valid session found, redirecting to dashboard");

      // Save user data to localStorage (if not already there)
      if (data.data) {
        localStorage.setItem(
          LOGIN_CONFIG.STORAGE_KEYS.USER,
          JSON.stringify(data.data)
        );
      }

      window.location.href = LOGIN_CONFIG.ROUTES.DASHBOARD;
      return true;
    } else {
      console.log("No valid session found");
      // Clear any stale user data
      localStorage.removeItem(LOGIN_CONFIG.STORAGE_KEYS.USER);
      return false;
    }
  } catch (error) {
    console.error("Error checking session:", error);
    // Clear any stale user data
    localStorage.removeItem(LOGIN_CONFIG.STORAGE_KEYS.USER);
    return false;
  }
}

// ==================== EVENT LISTENERS & INITIALIZATION ====================

/**
 * Sets up all event listeners for the login page
 */
function setupLoginEventListeners() {
  // Main form submission
  DOM_ELEMENTS.loginForm.addEventListener("submit", handleLoginFormSubmission);

  // Navigation links
  DOM_ELEMENTS.forgotPasswordLink.addEventListener(
    "click",
    handleForgotPasswordClick
  );
  DOM_ELEMENTS.signUpLink.addEventListener("click", handleSignUpLinkClick);

  // Input field changes for better UX
  DOM_ELEMENTS.emailInput.addEventListener("input", handleInputFieldChange);
  DOM_ELEMENTS.passwordInput.addEventListener("input", handleInputFieldChange);

  console.log("Event listeners setup completed");
}

/**
 * Initializes the login page
 */
async function initializeLoginPage() {
  console.log("Initializing PeerPrep Login page...");

  // Check for existing valid session
  const hasValidSession = await checkExistingUserSession();
  if (hasValidSession) {
    return; // User will be redirected, no need to continue initialization
  }

  // Setup event listeners
  setupLoginEventListeners();

  // Initialize button state
  updateSignInButtonState();

  // Focus on email input for better UX
  DOM_ELEMENTS.emailInput.focus();

  console.log("PeerPrep Login page initialized successfully");
}

// ==================== MAIN APPLICATION ENTRY POINT ====================

// Initialize login page when DOM is ready
document.addEventListener("DOMContentLoaded", initializeLoginPage);
