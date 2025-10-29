import { elements } from "./elements.js";
import { getTopicLabel } from "../../shared/filters.js";

export function renderHistoryItems(historyData) {
    // Clear existing items
    const existingItems = elements.historyList.querySelectorAll(".history-item");
    existingItems.forEach((item) => item.remove());

    // If no history data, show empty state
    if (!historyData || historyData.length === 0) {
        elements.loadingState.classList.add("hidden");
        elements.emptyState.classList.remove("hidden");
        return;
    }

    // Hide loading and empty states
    elements.loadingState.classList.add("hidden");
    elements.emptyState.classList.add("hidden");

    // Sort by most recent attempt first
    historyData.sort((a, b) => {
        const dateA = a.attemptedAt ? new Date(a.attemptedAt).getTime() : 0;
        const dateB = b.attemptedAt ? new Date(b.attemptedAt).getTime() : 0;
        return dateB - dateA;
    });

    // Render each history item
    historyData.forEach((item) => {
        const historyItem = createHistoryItem(item);
        elements.historyList.appendChild(historyItem);
    });
}

function capitaliseFirstLetter(string) {
    if (!string || typeof string !== "string") return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createDifficultyBadge(difficulty) {
    const difficultyClass = difficulty?.toLowerCase();
    const difficultyBadge = createElement(
        "div",
        `difficulty-badge ${difficultyClass}`,
        capitaliseFirstLetter(difficulty)
    );

    return difficultyBadge;
}

function createQuestionInfo(historyData) {
    const questionInfo = createElement("div", "question-info");
    const questionTitle = createElement(
        "div",
        "question-title",
        historyData.title
    );
    const questionMeta = createElement("div", "question-meta");

    // Add meta items
    questionMeta.appendChild(
        createMetaItem("📅", formatDate(historyData.attemptedAt))
    );

    if (historyData.topics?.length > 0) {
        questionMeta.appendChild(
            createMetaItem("🏷️", formatTopics(historyData.topics))
        );
    }

    if (historyData.partner) {
        questionMeta.appendChild(
            createMetaItem("👥", `with ${historyData.partner}`)
        );
    }

    questionInfo.append(questionTitle, questionMeta);

    return questionInfo;
}

function createActionButton(latestCode) {
    const actionBtn = createElement("button", "action-btn", "View");
    actionBtn.addEventListener("click", () => {
        showCodeModal(latestCode);

        // window.location.href = attemptUrl;
    });

    return actionBtn;
}

function showCodeModal(code) {
    const modal = document.createElement('div');
    modal.className = 'history-code-modal';

    const content = document.createElement('div');
    content.className = 'history-code-modal-content';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'history-code-modal-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => modal.remove();

    const codeBlock = document.createElement('pre');
    codeBlock.className = 'history-code-modal-pre';
    codeBlock.textContent = code || '// No code saved';

    content.appendChild(closeBtn);
    content.appendChild(codeBlock);
    modal.appendChild(content);
    document.body.appendChild(modal);

    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

function createHistoryItem(historyData) {
    console.log(historyData);
    const item = createElement("div", "history-item");

    const difficultyBadge = createDifficultyBadge(historyData.difficulty);

    const questionInfo = createQuestionInfo(historyData);

    const actionBtn = createActionButton(historyData.latestCode);

    item.append(difficultyBadge, questionInfo, actionBtn);

    return item;
}

function createElement(tag, className, textContent = "") {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = textContent;
    return element;
}

function createMetaItem(icon, text) {
    const metaItem = document.createElement("div");
    metaItem.className = "meta-item";

    const iconSpan = document.createElement("span");
    iconSpan.className = "meta-icon";
    iconSpan.textContent = icon;

    const textSpan = document.createElement("span");
    textSpan.textContent = text;

    metaItem.appendChild(iconSpan);
    metaItem.appendChild(textSpan);

    return metaItem;
}

function formatTopics(topics) {
    if (!topics || topics.length === 0) {
        return "";
    }

    const formatted = topics
        .slice(0, 2)
        .map((topic) => getTopicLabel(topic))
        .join(", ");

    return topics.length > 2 ? `${formatted}, +${topics.length - 2}` : formatted;
}

function formatDate(dateString) {
    if (!dateString) return "Unknown date";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return "1 month ago";
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString();
}

export function filterHistory(historyData, filters) {
    return historyData.filter((item) => {
        // Difficulty filter
        if (
            filters.difficulty !== "all" &&
            item.difficulty?.toLowerCase() !== filters.difficulty.toLowerCase()
        ) {
            return false;
        }

        // Topic filter
        if (filters.topic !== "all") {
            const hasTopics = item.topics && Array.isArray(item.topics);
            if (!hasTopics || !item.topics.includes(filters.topic)) {
                return false;
            }
        }

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const titleMatch = item.title?.toLowerCase().includes(searchLower);
            const partnerMatch = item.partner?.toLowerCase().includes(searchLower);
            return titleMatch || partnerMatch;
        }

        return true;
    });
}