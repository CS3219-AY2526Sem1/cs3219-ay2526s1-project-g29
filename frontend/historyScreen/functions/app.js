import { elements } from "./elements.js";
import {
    checkSession,
    getQuestionsAttempted,
    logout,
    getQuestionById,
} from "./auth.js";
import { renderHistoryItems, filterHistory } from "./history.js";
import { DIFFICULTIES, TOPICS } from "../../shared/filters.js";
import { config } from "./config.js";

let questionsAttempted = [];
let historyData = [];
let currentFilters = {
    difficulty: "all",
    topic: "all",
    search: "",
};

function navigateTo(url) {
    window.location.href = url;
}

async function initialise() {
    const session = await checkSession();
    if (!session) {
        navigateTo(config.routes.login);
        return;
    }

    addFiltersToUI();

    setupEventListeners();

    await loadHistory();
}

function addFiltersToUI() {
    // Add difficulty filters to UI
    const difficultyFilter = elements.difficultyFilter;
    difficultyFilter.innerHTML = '<option value="all">All Difficulties</option>';
    DIFFICULTIES.forEach((difficulty) => {
        const option = document.createElement("option");
        option.value = difficulty.value;
        option.textContent = difficulty.label;
        difficultyFilter.appendChild(option);
    });

    // Add topic filters to UI
    const topicFilter = elements.topicFilter;
    topicFilter.innerHTML = '<option value="all">All Topics</option>';
    TOPICS.forEach((topic) => {
        const option = document.createElement("option");
        option.value = topic.value;
        option.textContent = topic.label;
        topicFilter.appendChild(option);
    });
}

function setupEventListeners() {
    // Dropdown menu
    elements.userAvatar.addEventListener("click", (e) => {
        e.stopPropagation();
        elements.dropdownMenu.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
        elements.dropdownMenu.classList.remove("show");
    });

    // Logout
    elements.logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
    });

    // Difficulty Filters
    elements.difficultyFilter.addEventListener("change", (e) => {
        currentFilters.difficulty = e.target.value;
        applyFilters();
    });

    // Topic Filters
    elements.topicFilter.addEventListener("change", (e) => {
        currentFilters.topic = e.target.value;
        applyFilters();
    });

    // Search Input
    elements.searchInput.addEventListener("input", (e) => {
        currentFilters.search = e.target.value;
        applyFilters();
    });
}

async function loadHistory() {
    try {
        questionsAttempted = await getQuestionsAttempted();
        historyData = [];
        for (const questionAttempted of questionsAttempted) {
            const questionData = await getQuestionById(questionAttempted.questionId);
            historyData.push({
                ...questionAttempted,
                ...questionData,
            });
        }
        renderHistoryItems(historyData);
    } catch (error) {
        console.error("Error loading history:", error);
        elements.loadingState.classList.add("hidden");
        elements.emptyState.classList.remove("hidden");
    }
}

function applyFilters() {
    const filteredHistory = filterHistory(historyData, currentFilters);
    const dateVal = (d) => (d ? new Date(d).getTime() : 0);
    filteredHistory.sort((a, b) => dateVal(b.attemptedAt) - dateVal(a.attemptedAt));
    renderHistoryItems(filteredHistory);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
} else {
    initialise();
}