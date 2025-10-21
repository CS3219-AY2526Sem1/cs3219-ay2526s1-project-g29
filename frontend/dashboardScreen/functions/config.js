export const config = {
    apiUrl: "http://localhost:3001", // Backend URL - Change if needed
    endpoints: {
        login: "/auth/login",
        verify: "/auth/verify-token",
        logout: "/auth/logout",
    },
    routes: {
        profile: "../profileScreen/profileScreen.html",
        login: "../loginScreen/loginScreen.html",
        history: "../historyScreen/historyScreen.html",
        match: "../matchScreen/matchScreen.html",
    },
};
