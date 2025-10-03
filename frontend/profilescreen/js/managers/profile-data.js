/**
 * Profile Data Management
 * Handles profile information display and formatting
 */

import { MOCK_DATA } from "../config.js";
import { DOMUtils } from "../utils/dom.js";

export class ProfileDataManager {
  /**
   * Get display name with fallback logic
   */
  static getDisplayName(userData) {
    return userData.username || userData.displayName || MOCK_DATA.username;
  }

  /**
   * Format date for display
   */
  static formatMemberSinceDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date unavailable";
    }
  }

  /**
   * Update profile title display
   */
  static updateProfileTitle(displayName) {
    DOMUtils.updateTextContent("profileTitle", `${displayName}'s Profile`);
  }

  /**
   * Update basic profile information
   */
  static updateBasicInfo(userData) {
    const username = userData.username || MOCK_DATA.username;
    const email = userData.email || MOCK_DATA.email;

    DOMUtils.updateTextContent("username", username);
    DOMUtils.updateTextContent("email", email);
  }

  /**
   * Update member since date
   */
  static updateMemberSince(userData) {
    const createdAt = userData.createdAt || MOCK_DATA.memberSince;
    const formattedDate = this.formatMemberSinceDate(createdAt);
    DOMUtils.updateTextContent("memberSince", formattedDate);
  }

  /**
   * Main method to update all profile information
   */
  static update(userData) {
    const displayName = this.getDisplayName(userData);

    this.updateProfileTitle(displayName);
    this.updateBasicInfo(userData);
    this.updateMemberSince(userData);
  }
}

// Backward compatibility function
export function updateProfileInfo(userData) {
  ProfileDataManager.update(userData);
}
