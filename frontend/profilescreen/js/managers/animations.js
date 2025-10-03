/**
 * Animation Management
 * Handles loading animations, transitions, and visual effects
 */

export class AnimationManager {
  static ANIMATION_TIMINGS = {
    PROGRESS_CHART: 300,
    STATS_LEGEND: 600,
    PROFILE_INFO: 900,
  };

  /**
   * Apply fade-in animation to an element
   */
  static fadeInElement(selector, delay = 0) {
    setTimeout(() => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.opacity = "1";
      }
    }, delay);
  }

  /**
   * Add loading animations with staggered timing
   */
  static applyLoadingAnimations() {
    this.fadeInElement(
      ".progress-chart",
      this.ANIMATION_TIMINGS.PROGRESS_CHART
    );
    this.fadeInElement(".stats-legend", this.ANIMATION_TIMINGS.STATS_LEGEND);
    this.fadeInElement(".profile-info", this.ANIMATION_TIMINGS.PROFILE_INFO);
  }
}

// Backward compatibility function
export function addLoadingAnimations() {
  AnimationManager.applyLoadingAnimations();
}
