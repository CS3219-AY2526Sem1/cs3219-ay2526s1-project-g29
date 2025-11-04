import { config } from "./config.js";

// Check if the user is authenticated
export async function checkSession() {
    try {
        const response = await fetch(`${config.apiUrl}${config.endpoints.verify}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            console.error(
                `Session check failed: ${response.status} ${response.statusText}`
            );
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Session check error:", error.message);
        return null;
    }
}

export async function getQuestionsAttempted() {
    try {
        const response = await fetch(
            `${config.apiUrl}${config.endpoints.questionsAttempted}`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch questions attempted");
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Error fetching questions attempted:", error);
        return [];
    }
}

export async function logout() {
    try {
        await fetch(`${config.apiUrl}${config.endpoints.logout}`, {
            method: "POST",
            credentials: "include",
        });
        try {
            localStorage.setItem('auth:logout', String(Date.now()));
            localStorage.removeItem('user');
        } catch {}
        try {
            const bc = new BroadcastChannel('auth');
            bc.postMessage({ type: 'logout' });
            bc.close?.();
        } catch {}
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        window.location.href = config.routes.login;
    }
}

export async function getQuestionById(questionId) {
    try {
        const response = await fetch(
            `${config.questionServiceUrl}${config.endpoints.questions}/${questionId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch question: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error(`Error fetching question ${questionId}:`, error);
        return null;
    }
}
