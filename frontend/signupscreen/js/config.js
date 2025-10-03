// Signup page configuration
export const config = {
  apiUrl: "http://localhost:3001/users",
  loginPath: "../loginscreen/login.html",

  // Validation rules
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },

  password: {
    minLength: 6,
    pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
  },

  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // UI settings
  messageTimeout: 5000,
  redirectDelay: 2000,
};
