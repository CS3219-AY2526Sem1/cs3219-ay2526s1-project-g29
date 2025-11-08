import { elements } from "./elements.js";
import {
    checkSession,
    // getQuestionsAttempted,
    logout,
    getQuestionById,
    getUserHistory,
} from "./auth.js";
import { renderHistoryItems, filterHistory } from "./history.js";
import { DIFFICULTIES, LANGUAGES, TOPICS } from "../../shared/filters.js";
import { config } from "./config.js";

let questionsAttempted = [];
let historyData = [];
let currentFilters = {
    difficulty: "all",
    language: "all",
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

    const userId = session.data?.user?.id || session.data?.id;

    addFiltersToUI();

    setupEventListeners();

    await loadHistory(userId);
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

    // Add language filters to UI
    const languageFilter = elements.languageFilter;
    languageFilter.innerHTML = '<option value="all">All Languages</option>';
    LANGUAGES.forEach((language) => {
        const option = document.createElement("option");
        option.value = language.value;
        option.textContent = language.label;
        languageFilter.appendChild(option);
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

    // Language Filters
    elements.languageFilter.addEventListener("change", (e) => {
        currentFilters.language = e.target.value;
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

async function loadHistory(userId) {
    try {
        // questionsAttempted = await getQuestionsAttempted();
        const historyRecords = await getUserHistory(userId);
        historyData = [];
        for (const record of historyRecords) {
            const currentUserParticipant = record.participants.find(
                p => p.id === userId
            );

            if (!currentUserParticipant) continue;

            //find partner
            const partner = record.participants.find(p => p.id !== userId);

            const questionData = await getQuestionById(record.questionId);

            if (questionData) {
                historyData.push({
                    sessionId: record.sessionId,
                    questionId: record.questionId,
                    title: questionData.title,
                    difficulty: questionData.difficulty,
                    topics: questionData.topics || [],
                    attemptedAt: record.updatedAt,
                    partner: partner?.username || 'Unknown',
                    latestCode: record.latestCode,
                    language: record.language || 'javascript',
                    questionData: questionData,
                });
            }
        }

        // for (const questionAttempted of questionsAttempted) {
        //     const questionData = await getQuestionById(questionAttempted.questionId);
        //     historyData.push({
        //         ...questionAttempted,
        //         ...questionData,
        //     });
        // }
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