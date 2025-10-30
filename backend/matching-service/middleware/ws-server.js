import { WebSocketServer } from "ws";

const wsConnections = {}; // userId -> ws

export function attachWebsocket(server) {
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    let userId = null;
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === "REGISTER" && data.userId) {
          userId = data.userId;
          wsConnections[userId] = ws;
          ws.send(JSON.stringify({ type: "REGISTERED", userId }));
        }
      } catch (e) {
        console.error("WS parse error:", e);
      }
    });
    ws.on("close", () => {
      if (userId && wsConnections[userId]) delete wsConnections[userId];
    });
  });
}

export function notifyUser(userId, payload) {
  const ws = wsConnections[userId];
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}