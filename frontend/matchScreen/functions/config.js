export const config = {
    // API Configuration
    api: {
        matchingService: "http://localhost:8002",
        userService: "http://localhost:3001",
    },
    
    // Endpoints
    endpoints: {
        match: "/match",
        cancel: "/cancel",
        session: "/session",
        verify: "/auth/verify-token",
        logout: "/auth/logout",
        userProfile: "/users/profile",
    },
    
    // Navigation Routes
    routes: {
        login: "../loginScreen/loginScreen.html",
        dashboard: "../dashboardScreen/dashboardScreen.html",
        profile: "../profileScreen/profileScreen.html",
        history: "../historyScreen/historyScreen.html",
        collaboration: "../collaborationScreen/collaborationScreen.html",
    },
    
    // Application Settings
    settings: {
        messageTimeout: 5000,
        matchTimeout: 30000,
        maxTopics: 16,
    },
    
    // Validation Rules
    validation: {
        difficulties: ["easy", "medium", "hard"],
        minTopics: 1,
        maxRetries: 3,
    },
    
    // Available Topics
    topics: [
        { value: "arrays", label: "Arrays" },
        { value: "strings", label: "Strings" },
        { value: "hash-tables", label: "Hash Tables" },
        { value: "linked-lists", label: "Linked Lists" },
        { value: "stacks", label: "Stacks" },
        { value: "queues", label: "Queues" },
        { value: "trees", label: "Trees" },
        { value: "graphs", label: "Graphs" },
        { value: "sorting", label: "Sorting" },
        { value: "searching", label: "Searching" },
        { value: "dynamic-programming", label: "Dynamic Programming" },
        { value: "recursion", label: "Recursion" },
        { value: "backtracking", label: "Backtracking" },
        { value: "greedy", label: "Greedy Algorithms" },
        { value: "bit-manipulation", label: "Bit Manipulation" },
        { value: "math", label: "Math" },
    ],
};
