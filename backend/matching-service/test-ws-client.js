import WebSocket from "ws";

const userId = process.argv[2] || "test-user";
const ws = new WebSocket("ws://localhost:8002");

ws.on("open", () => {
  ws.send(JSON.stringify({ type: "REGISTER", userId }));
  console.log(`Registered as ${userId}`);
});

ws.on("message", (msg) => {
  console.log(`${userId} WS message:`, msg.toString());
});

ws.on("close", () => console.log(`${userId} WS closed`));
ws.on("error", (err) => console.error(`${userId} WS error:`, err));