const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const SKILL_LEVELS = new Set(["low", "medium", "high"]);

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}

export function isValidPassword(password) {
  return typeof password === "string" && PASSWORD_REGEX.test(password);
}

export function isValidSkillLevel(level) {
  if (typeof level !== "string") {
    return false;
  }
  return SKILL_LEVELS.has(level.toLowerCase());
}

export function isValidQuestionsAttempted(value) {
  // Format: [{ questionId: String, attemptedAt: Date, partner: String }]
  if (value === undefined || value === null) {
    return true;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  // Validate each item in the array
  return value.every((item) => {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    // questionId is required and must be a string
    if (!item.questionId || typeof item.questionId !== "string") {
      return false;
    }

    // attemptedAt should be a valid date if provided
    if (item.attemptedAt !== undefined && item.attemptedAt !== null) {
      const date = new Date(item.attemptedAt);
      if (isNaN(date.getTime())) {
        return false;
      }
    }

    // partner should be a string
    if (typeof item.partner !== "string") {
      return false;
    }

    return true;
  });
}
