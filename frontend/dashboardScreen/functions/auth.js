import { config } from "./config.js";

export async function checkUserAuth() {
    try {
        const response = await fetch(`${config.apiUrl}${config.endpoints.verify}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            console.log("User not authenticated, redirecting to login");
            redirectToLogin();
            return false;
        }
    } catch (error) {
        console.error("Error verifying user session:", error);
        redirectToLogin();
        return false;
    }

    return true;
}

export async function logoutUser() {
    try {
        const response = await fetch(`${config.apiUrl}${config.endpoints.logout}`, {
            method: "POST",
            credentials: "include",
        }); 
        if (response.ok) {
            try {
                localStorage.setItem('auth:logout', String(Date.now()));
                localStorage.removeItem('user');
            } catch {}
            try {
                const bc = new BroadcastChannel('auth');
                bc.postMessage({ type: 'logout' });
                bc.close?.();
            } catch {}
            redirectToLogin();
        } else {
            console.error("Logout failed");
        }
    } catch (error) {
        console.error("Error during logout:", error);
    }   
}

function redirectToLogin() {
    window.location.href = config.routes.login;
}
