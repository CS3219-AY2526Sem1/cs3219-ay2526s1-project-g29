export const config = {
    apiUrl: "http://localhost:8004",
    questionServiceUrl: "http://localhost:8003",
    historyServiceUrl: "http://localhost:8005",
    endpoints: {
        questionsAttempted: "/users/questions-attempted",
        verify: "/auth/verify-token",
        logout: "/auth/logout",
        questions: "/api/questions",
    },
    routes: {
        login: "../loginScreen/loginScreen.html",
    },
};