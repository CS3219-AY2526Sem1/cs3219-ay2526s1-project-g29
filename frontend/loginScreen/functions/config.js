export const config = {
    apiUrl: "http://localhost:3001", // Backend URL - Change if needed
    endpoints: {
        login: "/auth/login",
        verify: "/auth/verify-token",
        logout: "/auth/logout",
    },
    routes: {
        dashboard: "../dashboardScreen/dashboardScreen.html",
        signup: "../signUpScreen/signUpScreen.html",
    },
    messageTimeout: 5000,
    redirectDelay: 2000,
};
