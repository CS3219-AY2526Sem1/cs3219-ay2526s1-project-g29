import { config } from "./config.js";

let ws = null;
let messageHandler = null;

export function connectWebSocket(userId, onMessage) {
    return new Promise((resolve, reject) => {
        const wsUrl = config.api.matchingService.replace(/^http/, "ws");
        ws = new WebSocket(wsUrl);

        messageHandler = onMessage;

        ws.onopen = () => {
            console.log("WebSocket connected");
            ws.send(JSON.stringify({ type: "REGISTER", userId }));
            resolve();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WS message received:", data);
                if (messageHandler) {
                    messageHandler(data);
                }
            } catch (error) {
                console.error("WS message parse error:", error);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            reject(error);
        };

        ws.onclose = () => {
            console.log("WebSocket closed");
        };
    });
}

export function disconnectWebSocket() {
    if (ws) {
        ws.close();
        ws = null;
        messageHandler = null;
    }
}