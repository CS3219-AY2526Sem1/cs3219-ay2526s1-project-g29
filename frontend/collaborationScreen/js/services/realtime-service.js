import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

import { COLLAB_CONFIG } from "../config.js";

export function createRealtimeSession({ sessionId, user, editorContext }) {
  const doc = new Y.Doc();
  const text = doc.getText("code");

  const provider = new WebsocketProvider(
    COLLAB_CONFIG.wsBase,
    sessionId,
    doc,
    {
      connect: false,
    }
  );

  provider.awareness.setLocalStateField("user", {
    id: user.id,
    username: user.username,
  });

  const binding = new MonacoBinding(
    text,
    editorContext.model,
    new Set([editorContext.instance]),
    provider.awareness
  );

  editorContext.instance.focus();
  editorContext.instance.setPosition({ lineNumber: 1, column: 1 });

  const statusHandlers = new Set();
  const awarenessHandlers = new Set();

  provider.on("status", (event) => {
    statusHandlers.forEach((handler) => handler(event));
  });

  provider.awareness.on("update", () => {
    const states = Array.from(provider.awareness.getStates().values());
    awarenessHandlers.forEach((handler) => handler(states));
  });

  return {
    connect() {
      provider.connect();
    },
    disconnect() {
      provider.disconnect();
    },
    destroy() {
      if (typeof binding.destroy === "function") {
        binding.destroy();
      }
      provider.destroy();
      doc.destroy();
    },
    onStatus(handler) {
      statusHandlers.add(handler);
      return () => statusHandlers.delete(handler);
    },
    onAwarenessUpdate(handler) {
      awarenessHandlers.add(handler);
      return () => awarenessHandlers.delete(handler);
    },
  };
}
