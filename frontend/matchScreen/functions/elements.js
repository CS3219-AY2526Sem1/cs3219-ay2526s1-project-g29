export const elements = {
    // Form Elements
    matchForm: document.getElementById("matchForm"),
    findMatchBtn: document.getElementById("findMatchBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    cancelMatchBtn: document.getElementById("cancelMatchBtn"),
    selectAllTopics: document.getElementById("selectAllTopics"),

    // Status Elements
    matchingStatus: document.getElementById("matchingStatus"),
    statusMessage: document.getElementById("statusMessage"),
    confirmationDialog: null,

    // Message Elements
    messageContainer: document.getElementById("messageContainer"),
    messageText: document.getElementById("messageText"),

    // Navigation Elements
    userAvatar: document.getElementById("userAvatar"),
    dropdownMenu: document.getElementById("dropdownMenu"),
    logoutBtn: document.getElementById("logoutBtn"),

    // Helper Functions
    getDifficulty() {
        const selected = document.querySelector('input[name="difficulty"]:checked');
        console.log("Selected difficulty:", selected ? selected.value : "none");
        return selected?.value || null;
    },

    getTopics() {
        const checked = document.querySelectorAll('input[name="topics"]:checked');
        const topics = Array.from(checked).map(cb => cb.value);
        console.log("Selected topics:", topics);
        return topics;
    },

    getAllDifficultyInputs() {
        return document.querySelectorAll('input[name="difficulty"]');
    },

    getAllTopicInputs() {
        return document.querySelectorAll('input[name="topics"]');
    },

    setFormState(disabled) {
        if (this.findMatchBtn) this.findMatchBtn.disabled = disabled;
        if (this.cancelBtn) this.cancelBtn.disabled = disabled;
        this.getAllDifficultyInputs().forEach(input => input.disabled = disabled);
        this.getAllTopicInputs().forEach(input => input.disabled = disabled);
    },

    initSelectAll() {
        if (this.selectAllTopics) {
            this.selectAllTopics.addEventListener('change', (e) => {
                const topicInputs = this.getAllTopicInputs();
                topicInputs.forEach(input => {
                    input.checked = e.target.checked;
                });

                const changeEvent = new Event('change', { bubbles: true });
                if (topicInputs.length > 0) {
                    topicInputs[0].dispatchEvent(changeEvent);
                }
            });

            this.getAllTopicInputs().forEach(input => {
                input.addEventListener('change', () => {
                    const topicInputs = this.getAllTopicInputs();
                    const allChecked = Array.from(topicInputs).every(inp => inp.checked);
                    this.selectAllTopics.checked = allChecked;
                });
            });
        }
    }
};