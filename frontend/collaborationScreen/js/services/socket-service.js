import { io } from "socket.io-client";
import { COLLAB_CONFIG } from "../config.js";

export function createSessionSocket({ sessionId, user, onReady, onParticipants, onError, onDisconnect }) {
  const socket = io(COLLAB_CONFIG.httpBase, {
    withCredentials: true,
    autoConnect: false,
  });

  socket.on("connect", () => {
    socket.emit("session:join", { sessionId, username: user?.username });
  });

  socket.on("session:ready", (payload) => {
    onReady?.(payload);
  });

  socket.on("session:participants", (payload) => {
    onParticipants?.(payload.participants ?? []);
  });

  socket.on("session:error", (payload) => {
    onError?.(payload?.message ?? "Unknown error");
  });

  socket.io.on("error", (err) => {
    onError?.(err?.message ?? "Connection error");
  });

  socket.on("connect_error", (err) => {
    onError?.(err?.message ?? "Connection error");
  });

  socket.on("disconnect", (reason) => {
    onDisconnect?.(reason);
  });

  return socket;
}
