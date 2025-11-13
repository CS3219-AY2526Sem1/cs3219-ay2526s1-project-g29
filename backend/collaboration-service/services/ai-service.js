import { GoogleGenerativeAI } from "@google/generative-ai";

const rateLimitStore = new Map();

const AI_CONFIG = {
    provider: process.env.AI_PROVIDER || "gemini",
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.AI_MODEL || "gemini-2.5-flash",
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
    rateLimit: {
        maxRequests: parseInt(process.env.AI_RATE_LIMIT || "10"),
        windowMs: parseInt(process.env.AI_RATE_WINDOW || "60000"),
    },
};

export function isAIConfigured() {
    return !!AI_CONFIG.apiKey;
}

export function checkRateLimit(userId) {
    const now = Date.now();
    const userRequests = rateLimitStore.get(userId) || [];

    // Remove old requests outside the time window
    const validRequests = userRequests.filter(
        (timestamp) => now - timestamp < AI_CONFIG.rateLimit.windowMs
    );

    // Check if within rate limit
    if (validRequests.length >= AI_CONFIG.rateLimit.maxRequests) {
        const oldestRequest = Math.min(...validRequests);
        const resetTime = oldestRequest + AI_CONFIG.rateLimit.windowMs;
        const waitTime = Math.ceil((resetTime - now) / 1000);

        return {
            allowed: false,
            remaining: 0,
            resetIn: waitTime,
        };
    }

    // Add current request
    validRequests.push(now);
    rateLimitStore.set(userId, validRequests);

    return {
        allowed: true,
        remaining: AI_CONFIG.rateLimit.maxRequests - validRequests.length,
        resetIn: Math.ceil(AI_CONFIG.rateLimit.windowMs / 1000),
    };
}

export async function generateExplanation({code, language, userId}) {
    if (!isAIConfigured()) {
        throw new Error(
            "AI service is not configured. Please add API key to environment variables."
        );
    }

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
        throw new Error(
            `Rate limit exceeded. Please wait ${rateCheck.resetIn} seconds before making another request.`
        );
    }

    const prompt = buildPrompt(code, language);

    return await callGemini(prompt);
}

function buildPrompt(code, language) {
    return `Explain the code below in detail, with purpose, logic and key components. This is the code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

async function callGemini(prompt) {
    try {
        const genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);
        const model = genAI.getGenerativeModel({ model: AI_CONFIG.model });

        const result = await model.generateContent(prompt);

        const text = result.response.text();
        if (!text || typeof text !== "string") {
            console.error("Failed to extract text from Gemini response:", result);
            throw new Error("No explanation received from Gemini");
        }

        const usage = result.response?.usageMetadata || {};
        return {
            explanation: text,
            usage: {
                promptTokens: usage.promptTokenCount || 0,
                completionTokens: usage.candidatesTokenCount || 0,
                totalTokens: usage.totalTokenCount || 0,
            },
        };
    } catch (error) {
        const msg = error?.message || "Gemini error";
        throw new Error(msg);
    }
}

export function getAIStatus() {
    return {
        configured: isAIConfigured(),
        provider: AI_CONFIG.provider,
        rateLimit: {
            maxRequests: AI_CONFIG.rateLimit.maxRequests,
            windowSeconds: AI_CONFIG.rateLimit.windowMs / 1000,
        },
    };
}