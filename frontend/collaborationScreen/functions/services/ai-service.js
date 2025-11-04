import { COLLAB_CONFIG } from "../config.js";

export async function getAIStatus() {
    try {
        const response = await fetch(`${COLLAB_CONFIG.httpBase}/ai/status`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get AI status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error getting AI status:", error);
        throw error;
    }
}

export async function explainCode({ code, language = "javascript" }) {
    try {
        const response = await fetch(`${COLLAB_CONFIG.httpBase}/ai/explain`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code,
                language,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || data.error || "Failed to get explanation"
            );
        }

        return data;
    } catch (error) {
        console.error("Error explaining code:", error);
        throw error;
    }
}