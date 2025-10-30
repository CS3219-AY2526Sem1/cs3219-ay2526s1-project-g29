// Temporary storage for all the difficulties and topics used in the app

export const DIFFICULTIES = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
];

export const TOPICS = [
    { value: "arrays", label: "Arrays" },
    { value: "strings", label: "Strings" },
    { value: "algorithms", label: "Algorithms" },
    { value: "data-structures", label: "Data Structures" },
    { value: "hash-tables", label: "Hash Tables" },
    { value: "linked-lists", label: "Linked Lists" },
    { value: "stacks", label: "Stacks" },
    { value: "queues", label: "Queues" },
    { value: "trees", label: "Trees" },
    { value: "graphs", label: "Graphs" },
    { value: "sorting", label: "Sorting" },
    { value: "searching", label: "Searching" },
    { value: "dynamic-programming", label: "Dynamic Programming" },
    { value: "recursion", label: "Recursion" },
    { value: "backtracking", label: "Backtracking" },
    { value: "greedy", label: "Greedy Algorithms" },
    { value: "bit-manipulation", label: "Bit Manipulation" },
    { value: "math", label: "Math" },
    { value: "matrix", label: "Matrix" },
];

export function getTopicLabel(value) {
    const topic = TOPICS.find((t) => t.value === value);

    if (topic) {
        return topic.label;
    }

    if (typeof value === "string") {
        return value
            .split(/[-_\s]+/)
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    }

    return value;
}

export function getDifficultyLabel(value) {
    const difficulty = DIFFICULTIES.find((d) => d.value === value);
    return difficulty ? difficulty.label : value;
}