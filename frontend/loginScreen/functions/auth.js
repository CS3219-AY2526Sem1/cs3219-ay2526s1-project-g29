import { config } from "./config.js";

// Check if the user has an active valid session
export async function checkSession() {
    try {
        const response = await fetch(`${config.apiUrl}${config.endpoints.verify}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            console.error(`Session check failed: ${response.status} ${response.statusText}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Session check error:", error.message);
        return null;
    }
}

export async function login(email, password) {
    const response = await fetch(`${config.apiUrl}${config.endpoints.login}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error(`Login failed: ${response.status} ${response.statusText}`);
        console.error("Server response:", data);

        const errorMessage = data.message || `Login failed: ${response.statusText}`;
        throw new Error(errorMessage);
    }

    return data;
}

export async function logout() {
    try {
        const response = await fetch(`${config.apiUrl}${config.endpoints.logout}`, {
            method: "POST",
            credentials: "include",
        });

        if (!response.ok) {
            console.error(`Logout failed: ${response.status} ${response.statusText}`);
        }

    } catch (error) {
        console.error("Logout error:", error.message);
    }
}
