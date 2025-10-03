/**
 * Navigation Management
 * Handles tab navigation, routing, and user menu interactions
 */

import { DOMUtils } from "../utils/dom.js";
import { AuthManager } from "./auth.js";

export class NavigationManager {
  static TAB_ACTIONS = {
    profileTab: () => {
      // Already on profile page - no action needed
      console.log("Profile tab selected");
    },
    matchTab: () => {
      alert("Match feature coming soon!");
    },
    historyTab: () => {
      alert("History feature coming soon!");
    },
  };

  /**
   * Handle tab click events
   */
  static handleTabClick(event, tab) {
    event.preventDefault();

    this.setActiveTab(tab);
    this.executeTabAction(tab.id);
  }

  /**
   * Set the active tab and remove active class from others
   */
  static setActiveTab(activeTab) {
    const allTabs = document.querySelectorAll(".nav-tab");

    allTabs.forEach((tab) => {
      tab.classList.remove("active");
    });

    activeTab.classList.add("active");
  }

  /**
   * Execute the action associated with a tab
   */
  static executeTabAction(tabId) {
    const action = this.TAB_ACTIONS[tabId];
    if (action) {
      action();
    } else {
      console.warn(`No action defined for tab: ${tabId}`);
    }
  }

  /**
   * Initialize navigation event listeners
   */
  static initialize() {
    const tabs = document.querySelectorAll(".nav-tab");

    tabs.forEach((tab) => {
      tab.addEventListener("click", (event) => {
        this.handleTabClick(event, tab);
      });
    });
  }
}

export class UserMenuManager {
  static elements = {
    userAvatar: () => DOMUtils.getElementById("userAvatar"),
    dropdownMenu: () => DOMUtils.getElementById("dropdownMenu"),
    logoutBtn: () => DOMUtils.getElementById("logoutBtn"),
  };

  /**
   * Toggle dropdown menu visibility
   */
  static toggleDropdown(event) {
    event.stopPropagation();
    DOMUtils.toggleClass("dropdownMenu", "show");
  }

  /**
   * Close dropdown menu
   */
  static closeDropdown() {
    DOMUtils.removeClass("dropdownMenu", "show");
  }

  /**
   * Prevent dropdown from closing when clicking inside
   */
  static preventDropdownClose(event) {
    event.stopPropagation();
  }

  /**
   * Handle logout button click
   */
  static handleLogout(event) {
    event.preventDefault();
    AuthManager.logout();
  }

  /**
   * Setup dropdown event listeners
   */
  static setupDropdownEvents() {
    const userAvatar = this.elements.userAvatar();
    const dropdownMenu = this.elements.dropdownMenu();
    const logoutBtn = this.elements.logoutBtn();

    if (userAvatar) {
      userAvatar.addEventListener("click", this.toggleDropdown.bind(this));
    }

    if (dropdownMenu) {
      dropdownMenu.addEventListener(
        "click",
        this.preventDropdownClose.bind(this)
      );
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", this.handleLogout.bind(this));
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", this.closeDropdown.bind(this));
  }

  /**
   * Initialize user menu functionality
   */
  static initialize() {
    this.setupDropdownEvents();
  }
}

// Backward compatibility functions
export function initializeNavigation() {
  NavigationManager.initialize();
}

export function initializeUserMenu() {
  UserMenuManager.initialize();
}
