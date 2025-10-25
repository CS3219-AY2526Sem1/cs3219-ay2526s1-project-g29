import { checkSession, getUserProfile, logout } from "./auth.js";
import { config } from "./config.js";
import { elements } from "./elements.js";
import { updateProgressChart } from "./progress-chart.js";
import { ProfileEditManager } from "./profile-edit.js";

function navigateTo(url) {
    window.location.href = url;
}

function updateUserInfo(profileData) {
    elements.username.textContent = profileData.username;
    elements.email.textContent = profileData.email;
    const createdDate = new Date(profileData.createdAt);
    elements.memberSince.textContent = createdDate.toLocaleDateString();
}

function setupDropdownMenu() {
    const userAvatar = document.getElementById('userAvatar');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    if (userAvatar && dropdownMenu) {
        // Toggle dropdown when avatar is clicked
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userAvatar.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });

        // Close dropdown when pressing escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
            navigateTo(config.routes.login);
        });
    }
}

async function initialiseProfile() {
    try {
        const sessionData = await checkSession();

        if (!sessionData) {
            navigateTo(config.routes.login);
            return;
        }

        setupDropdownMenu();
        ProfileEditManager.initialize();

        const profileData = await getUserProfile();
        if (!profileData) {
            console.error("Failed to load profile data.");
            return;
        }

        localStorage.setItem("user", JSON.stringify(profileData));
        
        // Test with mock data first
        const mockQuestionStats = { easy: 0, medium: 5, hard: 2 };
        updateProgressChart(mockQuestionStats);
        // updateProgressChart(profileData.questionStats);
        
        updateUserInfo(profileData);
    } catch (error) {
        console.error("Error initializing profile:", error);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseProfile);
} else {
    initialiseProfile();
}