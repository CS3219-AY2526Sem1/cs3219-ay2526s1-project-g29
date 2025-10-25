import { config } from "./config.js";

export class ProfileEditManager {
  static elements = {
    editBtn: document.getElementById("editProfileBtn"),
    modal: document.getElementById("editModal"),
    closeBtn: document.getElementById("closeModalBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    saveBtn: document.getElementById("saveBtn"),
    form: document.getElementById("editProfileForm"),
    loadingSpinner: document.getElementById("loadingSpinner"),
    successMessage: document.getElementById("successMessage"),
    usernameInput: document.getElementById("editUsername"),
    emailInput: document.getElementById("editEmail"),
    passwordInput: document.getElementById("editPassword"),
  };

  static initialize() {
    this.setupEventListeners();
  }

  static setupEventListeners() {
    const { editBtn, closeBtn, cancelBtn, saveBtn, modal } = this.elements;

    if (editBtn) {
      editBtn.addEventListener("click", () => this.openModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.closeModal());
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.handleSaveChanges());
    }

    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal?.classList.contains("show")) {
        this.closeModal();
      }
    });
  }

  static openModal() {
    const { modal, successMessage } = this.elements;
    
    if (modal) {
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
    }

    if (successMessage) {
      successMessage.classList.remove("show");
    }

    this.clearErrors();
  }

  static closeModal() {
    const { modal, form } = this.elements;
    
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "";
    }

    if (form) {
      form.reset();
    }

    this.clearErrors();
  }

  static clearErrors() {
    const errorElements = document.querySelectorAll(".error-message");
    errorElements.forEach((el) => {
      el.classList.remove("show");
      el.textContent = "";
    });
  }

  static showError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("show");
    }
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidPassword(password) {
    // At least 8 characters
    return password.length >= 8;
  }

  static validateForm(formData) {
    this.clearErrors();
    let isValid = true;

    if (formData.username !== undefined) {
      if (formData.username.length < 3) {
        this.showError("username", "Username must be at least 3 characters");
        isValid = false;
      } else if (formData.username.length > 50) {
        this.showError("username", "Username must be less than 50 characters");
        isValid = false;
      }
    }

    if (formData.email !== undefined) {
      if (!this.isValidEmail(formData.email)) {
        this.showError("email", "Please enter a valid email address");
        isValid = false;
      }
    }

    if (formData.password !== undefined) {
      if (!this.isValidPassword(formData.password)) {
        this.showError("password", "Password must be at least 8 characters");
        isValid = false;
      }
    }

    return isValid;
  }
  
  static getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
        console.log("No user data in localStorage");
        return null;
    }
    
    try {
        const user = JSON.parse(userStr);
        console.log("User data from localStorage:", user);
        
        if (!user.id && user._id) {
            user.id = user._id;
        }
            
        return user;
    } catch (e) {
        console.error("Error parsing user data:", e);
        return null;
    }
}

   static async updateUserProfile(userId, updateData) {
    try {
      const response = await fetch(`${config.apiUrl}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      console.log("API Request:", `${config.apiUrl}/users/${userId}`);
      console.log("Update data:", updateData);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to update profile");
      }

      const result = await response.json();
      console.log("API Response:", result);
      return result;
    } catch (err) {
      console.error("API Error:", err);
      throw err;
    }
  }

  static async handleSaveChanges() {
    const { usernameInput, emailInput, passwordInput, saveBtn, loadingSpinner, successMessage } = this.elements;

    const formData = {};
    
    if (usernameInput?.value.trim()) {
      formData.username = usernameInput.value.trim();
    }
    if (emailInput?.value.trim()) {
      formData.email = emailInput.value.trim();
    }
    if (passwordInput?.value) {
      formData.password = passwordInput.value;
    }

    if (Object.keys(formData).length === 0) {
      this.showError("username", "Please make at least one change");
      return;
    }

    if (!this.validateForm(formData)) {
      return;
    }

    const currentUser = this.getCurrentUser();

    const userId = currentUser?.id || currentUser?._id;

    if (!currentUser || !userId) {
      console.error("User validation failed:", currentUser);
      this.showError("username", "User data not found. Please log in again.");
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (loadingSpinner) loadingSpinner.classList.add("show");

    try {
      const response = await this.updateUserProfile(userId, formData);
      const updatedUser = response.data || response;
      
      // Update localStorage
      const newUserData = { ...currentUser, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUserData));

      // Update UI
      if (formData.username) {
        document.getElementById("username").textContent = formData.username;
      }
      if (formData.email) {
        document.getElementById("email").textContent = formData.email;
      }

      if (successMessage) {
        successMessage.classList.add("show");
      }

      // Close modal after delay
      setTimeout(() => {
        this.closeModal();
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      this.showError("username", err.message || "Failed to update profile. Please try again.");
    } finally {
      if (saveBtn) saveBtn.disabled = false;
      if (loadingSpinner) loadingSpinner.classList.remove("show");
    }
  }
}
