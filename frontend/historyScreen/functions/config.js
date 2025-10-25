export const config = {
    apiUrl: "http://localhost:3001",
    questionServiceUrl: "http://localhost:3003",
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