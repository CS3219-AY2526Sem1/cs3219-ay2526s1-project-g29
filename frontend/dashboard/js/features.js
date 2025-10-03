/**
 * Dashboard Features Manager
 * Handles feature card interactions and navigation
 */

import { DASHBOARD_CONFIG } from "./config.js";

export class FeaturesManager {
  /**
   * Initializes click handlers for all feature cards
   */
  static initializeFeatureCards() {
    const featureCards = document.querySelectorAll(
      DASHBOARD_CONFIG.SELECTORS.FEATURE_CARDS
    );

    if (featureCards.length === 0) {
      console.warn("No feature cards found on the page");
      return;
    }

    featureCards.forEach((card, index) => {
      card.addEventListener("click", () => this.handleFeatureCardClick(card));
      console.log(`Feature card ${index + 1} initialized`);
    });

    console.log(
      `Successfully initialized ${featureCards.length} feature cards`
    );
  }

  /**
   * Handles click events on feature cards
   * @param {HTMLElement} card - The clicked feature card element
   */
  static handleFeatureCardClick(card) {
    const featureType = card.dataset.feature;

    if (!featureType) {
      console.error("Feature card missing data-feature attribute");
      this.showFeatureComingSoon("Unknown Feature");
      return;
    }

    console.log(`Feature card clicked: ${featureType}`);

    switch (featureType) {
      case DASHBOARD_CONFIG.FEATURES.HISTORY:
        this.handleHistoryFeature();
        break;

      case DASHBOARD_CONFIG.FEATURES.MATCH:
        this.handleMatchFeature();
        break;

      default:
        console.warn(`Unknown feature type: ${featureType}`);
        this.showFeatureComingSoon(featureType);
    }
  }

  /**
   * Handles History feature activation
   */
  static handleHistoryFeature() {
    console.log("History feature requested");
    this.showFeatureComingSoon("History");
    // TODO: Implement navigation to history page
    // window.location.href = "../historyscreen/history.html";
  }

  /**
   * Handles Match feature activation
   */
  static handleMatchFeature() {
    console.log("Match feature requested");
    this.showFeatureComingSoon("Matching Service");
    // TODO: Implement navigation to match page
    // window.location.href = "../matchscreen/match.html";
  }

  /**
   * Shows coming soon message for features
   * @param {string} featureName - Name of the feature
   */
  static showFeatureComingSoon(featureName) {
    alert(`${featureName} feature coming soon!`);
  }
}
