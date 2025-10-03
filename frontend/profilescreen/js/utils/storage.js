/**
 * Storage Management Utilities
 * Handles localStorage operations with error handling
 */

import { CONFIG } from "../config.js";

export class StorageManager {
  static get(key) {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;

      // Special handling for accessToken - it's stored as plain string
      if (key === CONFIG.STORAGE_KEYS.ACCESS_TOKEN) {
        return value; // Return as plain string
      }

      // For other keys, try to parse as JSON
      try {
        return JSON.parse(value);
      } catch (parseError) {
        // If JSON parse fails, return as plain string
        console.warn(
          `Key ${key} is not valid JSON, returning as string:`,
          value
        );
        return value;
      }
    } catch (error) {
      console.error(`Error getting localStorage key ${key}:`, error);
      return null;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting localStorage key ${key}:`, error);
      return false;
    }
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }
}
