import { elements } from "./elements.js";
import { config } from "./config.js";

export function updateProgressChart(questionStats) {
    const totalQuestions = questionStats.easy + questionStats.medium + questionStats.hard;

    if (totalQuestions === 0) {
        return;
    }

    const circumference = config.progressChart.circumference;

    const circleData = [
        {
            element: elements.easyProgress,
            count: questionStats.easy,
            textElement: elements.easyCount,
            label: "Easy",
        },
        {
            element: elements.mediumProgress,
            count: questionStats.medium,
            textElement: elements.mediumCount,
            label: "Medium",
        },
        {
            element: elements.hardProgress,
            count: questionStats.hard,
            textElement: elements.hardCount,
            label: "Hard",
        },
    ];

    let currentOffset = 0;

    // Update circle
    circleData.forEach(({ element, count, textElement, label }) => {
        if (element) {
            if (count > 0) {
                const length = (count / totalQuestions) * circumference;
                element.style.strokeDasharray = `${length} ${circumference}`;
                element.style.strokeDashoffset = `${-currentOffset}`;
                currentOffset += length;
            } else {
                element.style.strokeDasharray = config.progressChart.emptyDashArray;
            }
        }

        if (textElement) {
            textElement.textContent = `${count} ${label}`;
        }
    });

    elements.totalQuestions.textContent = totalQuestions;
}