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

export async function getUserProfile() {
    try {
        const response = await fetch(`${config.apiUrl}${config.endpoints.userProfile}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            console.error(`Get profile failed: ${response.status} ${response.statusText}`);
            return null;
        }
        const responseData = await response.json();
        const profileData = responseData.data;
        return profileData;
    } catch (error) {
        console.error("Get profile error:", error.message);
        return null;
    }
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