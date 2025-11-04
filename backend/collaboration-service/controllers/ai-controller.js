import {
    generateExplanation,
    checkRateLimit,
    getAIStatus,
    isAIConfigured,
} from "../services/ai-service.js";

export async function explainCode(req, res) {
    try {
        if (!isAIConfigured()) {
            return res.status(503).json({
                error: "AI service is not configured",
                message: "The AI explanation feature requires an API key to be configured.",
            });
        }

        const { code, language } = req.body;

        // Validate input
        if (!code || typeof code !== "string") {
            return res.status(400).json({
                error: "Invalid input",
                message: "Code is required and must be a string",
            });
        }

        if (code.length > 10000) {
            return res.status(400).json({
                error: "Code too long",
                message: "Maximum code length is 10,000 characters",
            });
        }

        const userId = req.user?.id

        // Check rate limit before making API call
        const rateCheck = checkRateLimit(userId);
        if (!rateCheck.allowed) {
            return res.status(429).json({
                error: "Rate limit exceeded",
                message: `Too many requests. Please wait ${rateCheck.resetIn} seconds.`,
                retryAfter: rateCheck.resetIn,
            });
        }

        // Generate explanation
        const result = await generateExplanation({code, language, userId});

        return res.status(200).json({
            success: true,
            explanation: result.explanation,
            remaining: rateCheck.remaining,
        });
    } catch (error) {
        console.error("AI explanation error:", error);

        // Handle rate limit errors
        if (error.message.includes("Rate limit exceeded")) {
            const match = error.message.match(/wait (\d+) seconds/);
            const retryAfter = match ? parseInt(match[1]) : 60;

            return res.status(429).json({
                error: "Rate limit exceeded",
                message: error.message,
                retryAfter,
            });
        }

        // Handle API errors
        if (error.message.includes("API")) {
            return res.status(502).json({
                error: "AI service error",
                message: "Failed to get explanation from AI service",
            });
        }

        // Generic error
        return res.status(500).json({
            error: "Server error",
            message: "An error occurred while generating the explanation",
        });
    }
}

export async function getStatus(req, res) {
    try {
        const status = getAIStatus();
        return res.status(200).json(status);
    } catch (error) {
        console.error("Error getting AI status:", error);
        return res.status(500).json({
            error: "Server error",
            message: "Failed to get AI service status",
        });
    }
}