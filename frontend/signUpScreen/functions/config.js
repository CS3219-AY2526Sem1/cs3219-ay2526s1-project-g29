export const config = {
    apiUrl: "http://localhost:3001",
    endpoints: {
        signup: "/users",
    },
    routes: {
        login: "../loginScreen/loginScreen.html",
    },
    validation: {
        username: {
            minLength: 3,
            maxLength: 20,
            pattern: /^[a-zA-Z0-9_]+$/,
            message: "Username must be 3-20 characters, letters/numbers/underscore only",
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Please enter a valid email address",
        },
        password: {
            minLength: 8,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
            message: "Password must be 8+ characters with lowercase, uppercase, and number",
        },
    },
    messageTimeout: 5000,
    redirectDelay: 2000,
};
