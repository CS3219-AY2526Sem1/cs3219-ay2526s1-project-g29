/**
 * DOM Manipulation Utilities
 * Provides convenient methods for DOM element operations
 */

export class DOMUtils {
  static getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id '${id}' not found`);
    }
    return element;
  }

  static updateTextContent(id, content) {
    const element = this.getElementById(id);
    if (element) {
      element.textContent = content;
    }
  }

  static toggleClass(id, className) {
    const element = this.getElementById(id);
    if (element) {
      element.classList.toggle(className);
    }
  }

  static addClass(id, className) {
    const element = this.getElementById(id);
    if (element) {
      element.classList.add(className);
    }
  }

  static removeClass(id, className) {
    const element = this.getElementById(id);
    if (element) {
      element.classList.remove(className);
    }
  }
}
