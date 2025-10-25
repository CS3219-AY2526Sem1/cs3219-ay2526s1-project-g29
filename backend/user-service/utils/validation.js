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

export function isValidQuestionsCompleted(value) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    if (value.trim() === "") {
      return false;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return false;
    }
    return true;
  }

  return Number.isInteger(value) && value >= 0;
}
