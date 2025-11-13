export const elements = {
    panel: document.getElementById("aiPanel"),
    explainBtn: document.getElementById("aiExplainBtn"),
    closeBtn: document.getElementById("aiCloseBtn"),
    output: document.getElementById("aiOutput"),
    placeholder: document.querySelector("#aiOutput .ai-placeholder"),
    loading: document.querySelector("#aiOutput .ai-loading"),
    error: document.querySelector("#aiOutput .ai-error"),
    errorMessage: document.querySelector("#aiOutput .ai-error-message"),
    explanation: document.querySelector("#aiOutput .ai-explanation"),
};

export function validateAIElements(elements) {
    const required = ["panel", "explainBtn", "closeBtn", "output"];
    return required.every((key) => elements[key] !== null);
}