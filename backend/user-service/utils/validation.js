const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}

export function isValidPassword(password) {
  return typeof password === "string" && PASSWORD_REGEX.test(password);
}
