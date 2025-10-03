export const config = {
  apiUrl: "http://localhost:3001",
  endpoints: {
    login: "/auth/login",
    verify: "/auth/verify-token",
    logout: "/auth/logout",
  },
  routes: {
    dashboard: "../dashboard/dashboard.html",
    profile: "../profilescreen/profile.html",
    signup: "../signupscreen/signup.html",
  },
  storage: {
    user: "user",
  },
  messageTimeout: 5000,
  redirectDelay: 2000,
};
