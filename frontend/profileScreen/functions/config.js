export const config = {
    apiUrl: "http://localhost:3001",
    endpoints: {
        verify: "/auth/verify-token",
        userProfile: "/users/profile",
        logout: "/auth/logout",
    },
    routes: {
        login: "../loginScreen/loginScreen.html",
        dashboard: "../dashboardScreen/dashboardScreen.html",
        profile: "../profileScreen/profileScreen.html",
        match: "../matchScreen/matchScreen.html",
        history: "../historyScreen/historyScreen.html",
    },
    progressChart: {
        radius: 90,
        get circumference() {
            return 2 * Math.PI * this.radius;
        },
        get emptyDashArray() {
            return `0 ${this.circumference}`;
        },
        strokeWidth: 12,
        animationDuration: "1s ease-in-out",
    },
};
