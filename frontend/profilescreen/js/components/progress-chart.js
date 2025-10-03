/**
 * Progress Chart Component
 * Handles all progress chart calculations, updates, and rendering
 */

import { DOMUtils } from "../utils/dom.js";
import { AchievementManager } from "../managers/achievements.js";

export class ProgressChart {
  constructor() {
    this.radius = 90;
    this.circumference = 2 * Math.PI * this.radius;
  }

  /**
   * Calculate progress data for each difficulty level
   */
  calculateProgressData(stats) {
    const { easy, medium, hard } = stats;
    const total = easy + medium + hard;

    if (total === 0) {
      return { easy: 0, medium: 0, hard: 0, total: 0 };
    }

    return {
      easy: {
        count: easy,
        percent: easy / total,
        dash: (easy / total) * this.circumference,
      },
      medium: {
        count: medium,
        percent: medium / total,
        dash: (medium / total) * this.circumference,
      },
      hard: {
        count: hard,
        percent: hard / total,
        dash: (hard / total) * this.circumference,
      },
      total,
    };
  }

  /**
   * Update the numerical displays
   */
  updateCounterDisplays(data) {
    DOMUtils.updateTextContent("totalQuestions", data.total.toString());
    DOMUtils.updateTextContent("easyCount", `${data.easy.count} Easy`);
    DOMUtils.updateTextContent("mediumCount", `${data.medium.count} Medium`);
    DOMUtils.updateTextContent("hardCount", `${data.hard.count} Hard`);
  }

  /**
   * Update individual progress ring with calculated values
   */
  updateProgressRing(elementId, dashLength, dashOffset = 0) {
    const ring = DOMUtils.getElementById(elementId);
    if (!ring) return;

    ring.style.strokeDasharray = `${dashLength} ${this.circumference}`;
    ring.style.strokeDashoffset = dashOffset.toString();
  }

  /**
   * Update all progress rings with proper positioning
   */
  updateProgressRings(data) {
    // Easy questions (starts at top)
    this.updateProgressRing("easyProgress", data.easy.dash, 0);

    // Medium questions (starts after easy)
    this.updateProgressRing(
      "mediumProgress",
      data.medium.dash,
      -data.easy.dash
    );

    // Hard questions (starts after easy + medium)
    this.updateProgressRing(
      "hardProgress",
      data.hard.dash,
      -(data.easy.dash + data.medium.dash)
    );
  }

  /**
   * Main update method - orchestrates the chart update process
   */
  update(stats) {
    const progressData = this.calculateProgressData(stats);

    this.updateCounterDisplays(progressData);

    if (progressData.total > 0) {
      this.updateProgressRings(progressData);
    }

    // Trigger achievements update
    AchievementManager.update(stats);
  }
}

// Backward compatibility function
export function updateProgressChart(stats) {
  const chart = new ProgressChart();
  chart.update(stats);
}
