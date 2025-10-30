import { config } from "./config.js";

export async function requestMatch(userId, topics, difficulty, questionStats) {
    try {
        const response = await fetch(`${config.api.matchingService}${config.endpoints.match}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, topics, difficulty, questionStats }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to request match");
        }

        return data;
    } catch (error) {
        console.error("Request match error:", error);
        throw error;
    }
}

export async function cancelMatch(userId) {
    try {
        const response = await fetch(`${config.api.matchingService}${config.endpoints.cancel}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to cancel match");
        }

        return data;
    } catch (error) {
        console.error("Cancel match error:", error);
        throw error;
    }
}