import { COLLAB_CONFIG } from "../config.js";

export function createSessionSocket({ sessionId, onReady, onParticipants, onEditorEvent, onCursorEvent, onPresence, onControlEvent, onChatMessage, onError, onDisconnect }) {
  const url = `${COLLAB_CONFIG.wsBase}/${encodeURIComponent(sessionId)}`;
  let ws;

  function connect() {
    try {
      ws = new WebSocket(url);
    } catch (err) {
      onError?.(err?.message ?? "Failed to open WebSocket");
      return;
    }

    ws.onopen = () => {
      // No-op; backend sends a 'ready' event with participants
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (_) {
        return; // ignore non-JSON messages
      }

      switch (data.type) {
        case "ready":
          onReady?.({
            sessionId: data.sessionId,
            participants: data.participants ?? [],
            question: data.question ?? null,
          });
          break;
        case "participants":
          onParticipants?.(data.participants ?? []);
          break;
        case "presence":
          onPresence?.(data);
          break;
        case "message": {
          // payload may contain nested JSON like { type: 'editor-update', ... }
          let inner;
          try {
            inner = JSON.parse(data.payload);
          } catch (_) {
            inner = null;
          }
          if (inner) {
            if (inner.type === "editor-update") {
              onEditorEvent?.(inner);
            } else if (inner.type === "cursor") {
              onCursorEvent?.({ ...inner, from: data.from });
            } else if (
              inner.type === 'language-request' ||
              inner.type === 'language-response' ||
              inner.type === 'language-change'
            ) {
              onControlEvent?.(inner);
            }
          }
          break;
        }
        case "chat":
          onChatMessage?.(data);
          break;
        default:
          break;
      }
    };

    ws.onerror = (event) => {
      const msg = event?.message || "WebSocket error";
      onError?.(msg);
    };

    ws.onclose = (event) => {
      onDisconnect?.(event?.reason || "closed");
    };
  }

  function disconnect() {
    try { ws?.close(1000, "client disconnect"); } catch {}
    ws = null;
  }

  function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = typeof obj === "string" ? obj : JSON.stringify(obj);
      // Backend wraps arbitrary message in { type:'message', payload }
      ws.send(payload);
    }
  }

  return {
    connect,
    disconnect,
    send,
  };
}
