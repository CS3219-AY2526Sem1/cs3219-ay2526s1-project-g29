import { config } from "./config.js";

export async function signupUser(username, email, password) {
    const response = await fetch(`${config.apiUrl}${config.endpoints.signup}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data.message || `Signup failed: ${response.statusText}`;
        throw new Error(errorMessage);
    }

    return data;
}