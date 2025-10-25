import { config } from "./config.js";

export async function checkSession() {
    try {
        const response = await fetch(`${config.api.userService}${config.endpoints.verify}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            console.error(`Session check failed: ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Session check error:", error);
        return null;
    }
}

export async function getUserProfile() {
    try {
        const response = await fetch(`${config.api.userService}${config.endpoints.userProfile}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            console.error(`Get profile failed: ${response.status}`);
            return null;
        }

        const responseData = await response.json();
        return responseData.data;
    } catch (error) {
        console.error("Get profile error:", error);
        return null;
    }
}

export async function logout() {
    try {
        const response = await fetch(`${config.api.userService}${config.endpoints.logout}`, {
            method: "POST",
            credentials: "include",
        });

        if (!response.ok) {
            console.error(`Logout failed: ${response.status}`);
        }
    } catch (error) {
        console.error("Logout error:", error);
    }
}