import { explainCode, getAIStatus } from "../services/ai-service.js";
import { elements, validateAIElements } from "./elements.js";

let aiPanelOpen = false;

export function initializeAIPanel(editorInstance) {
    if (!validateAIElements(elements)) {
        console.warn("AI panel elements not found");
        return;
    }

    checkAIServiceStatus();

    // Explain button click
    elements.explainBtn.addEventListener("click", async () => {
        if (!editorInstance) {
            showAIError("Editor not initialized");
            return;
        }

        // Get highlighted code
        const selection = editorInstance.getSelection();
        const selectedText = editorInstance.getModel().getValueInRange(selection);

        if (!selectedText || selectedText.trim().length === 0) {
            showAIError("Please select code in the editor first");
            openAIPanel();
            return;
        }

        openAIPanel();
        showAILoading();

        try {
            const language = getEditorLanguage(editorInstance);

            const result = await explainCode({
                code: selectedText,
                language,
            });

            showAIExplanation(result.explanation);
        } catch (error) {
            console.error("AI explanation error:", error);
            showAIError(
                error.message || "Failed to get explanation. Please try again."
            );
        }
    });

    // Close button click
    elements.closeBtn.addEventListener("click", () => {
        closeAIPanel();
    });

    // Close panel when clicking outside
    document.addEventListener("click", (e) => {
        if (
            aiPanelOpen &&
            !elements.panel.contains(e.target) &&
            !elements.explainBtn.contains(e.target)
        ) {
            closeAIPanel();
        }
    });
}

async function checkAIServiceStatus() {
    try {
        const status = await getAIStatus();
        if (!status.configured) {
            console.warn("AI service not configured");
            elements.explainBtn.disabled = true;
        }
    } catch (error) {
        console.warn("Could not check AI service status:", error);
    }
}

function getEditorLanguage(editorInstance) {
    try {
        const model = editorInstance.getModel();
        if (model) {
            const language = model.getLanguageId();
            return language;
        }
    } catch (error) {
        console.warn("Could not detect editor language:", error);
    }
    return "javascript";
}

function openAIPanel() {
    if (elements.panel) {
        elements.panel.classList.add("open");
        aiPanelOpen = true;
    }
}

function closeAIPanel() {
    if (elements.panel) {
        elements.panel.classList.remove("open");
        aiPanelOpen = false;
    }
}

function showAILoading() {
    if (elements.output && elements.loading) {
        hideAllStates();
        elements.loading.style.display = "flex";
    }
}

function showAIExplanation(explanation) {
    if (elements.output && elements.explanation) {
        hideAllStates();
        const formatted = formatExplanation(explanation);
        elements.explanation.innerHTML = formatted;
        elements.explanation.style.display = "block";
    }
}

function showAIError(message) {
    if (elements.output && elements.error && elements.errorMessage) {
        hideAllStates();
        elements.errorMessage.textContent = message;
        elements.error.style.display = "block";
    }
}

function hideAllStates() {
    const stateElements = [
        elements.placeholder,
        elements.loading,
        elements.error,
        elements.explanation,
    ];
    stateElements.forEach((element) => {
        if (element) {
            element.style.display = "none";
        }
    });
}

/**
 * Format explanation text (basic markdown to HTML)
 */
function formatExplanation(text) {
    let formatted = escapeHtml(text);

    // Code blocks
    formatted = formatted.replace(
        /```(\w+)?\n([\s\S]+?)```/g,
        (match, lang, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        }
    );

    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Headers
    formatted = formatted.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    formatted = formatted.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    formatted = formatted.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Line breaks
    formatted = formatted.replace(/\n\n/g, "</p><p>");
    formatted = "<p>" + formatted + "</p>";

    // Lists
    formatted = formatted.replace(/<p>([•\-\*] .+?)<\/p>/gs, (match, content) => {
        const items = content
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => {
                const cleaned = line.replace(/^[•\-\*]\s+/, "");
                return `<li>${cleaned}</li>`;
            })
            .join("");
        return `<ul>${items}</ul>`;
    });

    // Numbered lists
    formatted = formatted.replace(/<p>(\d+\. .+?)<\/p>/gs, (match, content) => {
        const items = content
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => {
                const cleaned = line.replace(/^\d+\.\s+/, "");
                return `<li>${cleaned}</li>`;
            })
            .join("");
        return `<ol>${items}</ol>`;
    });

    return formatted;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}