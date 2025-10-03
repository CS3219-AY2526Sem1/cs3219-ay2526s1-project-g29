/**
 * PeerPrep Signup Screen - User registration functionality
 * Handles user registration, form validation, and real-time feedback
 */

// ==================== CONSTANTS & CONFIGURATION ====================

const SIGNUP_CONFIG = {
  API: {
    BASE_URL: "http://localhost:3001",
    ENDPOINTS: {
      SIGNUP: "/users",
    },
  },
  ROUTES: {
    LOGIN: "../loginscreen/login.html",
  },
  VALIDATION: {
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 20,
    MIN_PASSWORD_LENGTH: 6,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
    PASSWORD_REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
  },
  UI: {
    MESSAGE_DISPLAY_TIME: 5000,
    REDIRECT_DELAY: 2000,
    COLORS: {
      SUCCESS: "#48bb78",
      ERROR: "#f56565",
      DEFAULT: "",
    },
  },
};

// ==================== DOM ELEMENTS ====================

const DOM_ELEMENTS = {
  signupForm: document.getElementById("signupForm"),
  usernameInput: document.getElementById("username"),
  emailInput: document.getElementById("email"),
  passwordInput: document.getElementById("password"),
  confirmPasswordInput: document.getElementById("confirmPassword"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  messageContainer: document.getElementById("messageContainer"),
  messageText: document.getElementById("messageText"),
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
  }, SIGNUP_CONFIG.UI.MESSAGE_DISPLAY_TIME);
}

/**
 * Hides any currently displayed message
 */
function hideUserMessage() {
  DOM_ELEMENTS.messageContainer.style.display = "none";
}

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validates email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
function isValidEmail(email) {
  return SIGNUP_CONFIG.VALIDATION.EMAIL_REGEX.test(email);
}

/**
 * Validates username format (alphanumeric and underscores only)
 * @param {string} username - Username to validate
 * @returns {boolean} True if username is valid, false otherwise
 */
function isValidUsername(username) {
  return SIGNUP_CONFIG.VALIDATION.USERNAME_REGEX.test(username);
}

/**
 * Validates password strength (at least one letter and one number)
 * @param {string} password - Password to validate
 * @returns {boolean} True if password is valid, false otherwise
 */
function isValidPassword(password) {
  return SIGNUP_CONFIG.VALIDATION.PASSWORD_REGEX.test(password);
}

/**
 * Validates the complete signup form
 * @returns {Object} Validation result with isValid boolean and data object
 */
function validateSignupForm() {
  const username = DOM_ELEMENTS.usernameInput.value.trim();
  const email = DOM_ELEMENTS.emailInput.value.trim();
  const password = DOM_ELEMENTS.passwordInput.value.trim();
  const confirmPassword = DOM_ELEMENTS.confirmPasswordInput.value.trim();

  // Username validation
  if (!username) {
    showUserMessage("Please enter a username", "error");
    DOM_ELEMENTS.usernameInput.focus();
    return { isValid: false };
  }

  if (username.length < SIGNUP_CONFIG.VALIDATION.MIN_USERNAME_LENGTH) {
    showUserMessage(
      `Username must be at least ${SIGNUP_CONFIG.VALIDATION.MIN_USERNAME_LENGTH} characters long`,
      "error"
    );
    DOM_ELEMENTS.usernameInput.focus();
    return { isValid: false };
  }

  if (username.length > SIGNUP_CONFIG.VALIDATION.MAX_USERNAME_LENGTH) {
    showUserMessage(
      `Username must be less than ${SIGNUP_CONFIG.VALIDATION.MAX_USERNAME_LENGTH} characters long`,
      "error"
    );
    DOM_ELEMENTS.usernameInput.focus();
    return { isValid: false };
  }

  if (!isValidUsername(username)) {
    showUserMessage(
      "Username can only contain letters, numbers, and underscores",
      "error"
    );
    DOM_ELEMENTS.usernameInput.focus();
    return { isValid: false };
  }

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
    showUserMessage("Please enter a password", "error");
    DOM_ELEMENTS.passwordInput.focus();
    return { isValid: false };
  }

  if (password.length < SIGNUP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
    showUserMessage(
      `Password must be at least ${SIGNUP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`,
      "error"
    );
    DOM_ELEMENTS.passwordInput.focus();
    return { isValid: false };
  }

  if (!isValidPassword(password)) {
    showUserMessage(
      "Password must contain at least one letter and one number",
      "error"
    );
    DOM_ELEMENTS.passwordInput.focus();
    return { isValid: false };
  }

  // Confirm password validation
  if (!confirmPassword) {
    showUserMessage("Please confirm your password", "error");
    DOM_ELEMENTS.confirmPasswordInput.focus();
    return { isValid: false };
  }

  if (password !== confirmPassword) {
    showUserMessage("Passwords do not match", "error");
    DOM_ELEMENTS.confirmPasswordInput.focus();
    return { isValid: false };
  }

  return {
    isValid: true,
    data: { username, email, password },
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Registers a new user with the backend API
 * @param {string} username - User's chosen username
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} Registration response data
 * @throws {Error} If registration fails or network error occurs
 */
async function registerNewUser(username, email, password) {
  try {
    console.log("Attempting user registration...");

    const response = await fetch(
      `${SIGNUP_CONFIG.API.BASE_URL}${SIGNUP_CONFIG.API.ENDPOINTS.SIGNUP}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Registration failed");
    }

    console.log("User registration successful");
    return responseData;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// ==================== EVENT HANDLERS ====================

/**
 * Handles the signup form submission
 * @param {Event} event - Form submit event
 */
async function handleSignupFormSubmission(event) {
  event.preventDefault();
  hideUserMessage();

  // Validate form inputs
  const validation = validateSignupForm();
  if (!validation.isValid) {
    return;
  }

  const { username, email, password } = validation.data;

  try {
    showLoadingSpinner();

    // Register with backend
    const registrationResponse = await registerNewUser(
      username,
      email,
      password
    );

    // Show success message
    showUserMessage(
      `Account created successfully! Welcome ${username}! Redirecting to login...`,
      "success"
    );

    // Clear the form
    DOM_ELEMENTS.signupForm.reset();
    resetInputFieldStyles();

    // Redirect to login page after delay
    setTimeout(() => {
      console.log("Redirecting to login page...");
      window.location.href = SIGNUP_CONFIG.ROUTES.LOGIN;
    }, SIGNUP_CONFIG.UI.REDIRECT_DELAY);
  } catch (error) {
    const errorMessage = getSignupErrorMessage(error);
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
function getSignupErrorMessage(error) {
  if (error.message.includes("username or email already exists")) {
    return "An account with this username or email already exists. Please try different credentials.";
  } else if (
    error.message.includes("username and/or email and/or password are missing")
  ) {
    return "Please fill in all required fields.";
  } else if (
    error.message.includes("network") ||
    error.message.includes("fetch")
  ) {
    return "Unable to connect to server. Please check your connection.";
  } else if (error.message) {
    return error.message;
  }
  return "Signup failed. Please try again.";
}

/**
 * Resets all input field border colors to default
 */
function resetInputFieldStyles() {
  const inputs = [
    DOM_ELEMENTS.usernameInput,
    DOM_ELEMENTS.emailInput,
    DOM_ELEMENTS.passwordInput,
    DOM_ELEMENTS.confirmPasswordInput,
  ];

  inputs.forEach((input) => {
    input.style.borderColor = SIGNUP_CONFIG.UI.COLORS.DEFAULT;
  });
}

// Real-time validation feedback
function addValidationHints() {
  // Username validation hints
  usernameInput.addEventListener("input", () => {
    hideMessage();
    const username = usernameInput.value.trim();
    if (username.length > 0 && username.length < 3) {
      usernameInput.style.borderColor = "#f56565";
    } else if (username.length >= 3 && validateUsername(username)) {
      usernameInput.style.borderColor = "#48bb78";
    } else if (username.length > 0) {
      usernameInput.style.borderColor = "#f56565";
    } else {
      usernameInput.style.borderColor = "";
    }
  });

  // Email validation hints
  emailInput.addEventListener("input", () => {
    hideMessage();
    const email = emailInput.value.trim();
    if (email.length > 0) {
      if (validateEmail(email)) {
        emailInput.style.borderColor = "#48bb78";
      } else {
        emailInput.style.borderColor = "#f56565";
      }
    } else {
      emailInput.style.borderColor = "";
    }
  });

  // Password validation hints
  passwordInput.addEventListener("input", () => {
    hideMessage();
    const password = passwordInput.value.trim();
    if (password.length > 0) {
      if (password.length >= 6 && validatePassword(password)) {
        passwordInput.style.borderColor = "#48bb78";
      } else {
        passwordInput.style.borderColor = "#f56565";
      }
    } else {
      passwordInput.style.borderColor = "";
    }

    // Also check confirm password if it has a value
    const confirmPassword = confirmPasswordInput.value.trim();
    if (confirmPassword.length > 0) {
      if (password === confirmPassword) {
        confirmPasswordInput.style.borderColor = "#48bb78";
      } else {
        confirmPasswordInput.style.borderColor = "#f56565";
      }
    }
  });

  // Confirm password validation hints
  confirmPasswordInput.addEventListener("input", () => {
    hideMessage();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    if (confirmPassword.length > 0) {
      if (password === confirmPassword) {
        confirmPasswordInput.style.borderColor = "#48bb78";
      } else {
        confirmPasswordInput.style.borderColor = "#f56565";
      }
    } else {
      confirmPasswordInput.style.borderColor = "";
    }
  });
}

// Input event listeners for better UX
[usernameInput, emailInput, passwordInput, confirmPasswordInput].forEach(
  (input) => {
    input.addEventListener("input", () => {
      hideMessage();
    });
  }
);

// ==================== EVENT LISTENERS & INITIALIZATION ====================

/**
 * Sets up all event listeners for the signup page
 */
function setupSignupEventListeners() {
  // Main form submission
  DOM_ELEMENTS.signupForm.addEventListener(
    "submit",
    handleSignupFormSubmission
  );

  // Real-time validation and feedback
  setupRealTimeValidation();

  console.log("Event listeners setup completed");
}

/**
 * Sets up real-time validation feedback for input fields
 */
function setupRealTimeValidation() {
  // Input field changes for better UX
  const inputFields = [
    DOM_ELEMENTS.usernameInput,
    DOM_ELEMENTS.emailInput,
    DOM_ELEMENTS.passwordInput,
    DOM_ELEMENTS.confirmPasswordInput,
  ];

  inputFields.forEach((input) => {
    input.addEventListener("input", hideUserMessage);
  });

  // Add visual validation hints (keeping existing functionality)
  addValidationHints();
}

/**
 * Initializes the signup page
 */
function initializeSignupPage() {
  console.log("Initializing PeerPrep Signup page...");

  // Setup event listeners
  setupSignupEventListeners();

  // Focus on username input for better UX
  DOM_ELEMENTS.usernameInput.focus();

  console.log("PeerPrep Signup page initialized successfully");
}

// ==================== MAIN APPLICATION ENTRY POINT ====================

// Initialize signup page when DOM is ready
document.addEventListener("DOMContentLoaded", initializeSignupPage);
