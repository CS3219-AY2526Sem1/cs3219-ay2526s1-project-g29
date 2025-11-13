import { logoutUser, checkUserAuth } from "./auth.js";

function setUpEventListeners() {
    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn.addEventListener("click", logoutUser);
}

async function initialiseDashboard() {
    await checkUserAuth();
    setUpEventListeners();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseDashboard);
} else {
    initialiseDashboard();
}
