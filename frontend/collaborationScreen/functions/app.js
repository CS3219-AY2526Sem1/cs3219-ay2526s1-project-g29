import { COLLAB_CONFIG } from "./config.js";
import { initializeEditor } from "./services/editor-service.js";
import { createRealtimeSession } from "./services/realtime-service.js";
import { createSessionSocket } from "./services/socket-service.js";
import { resolveUserSession } from "./services/user-service.js";
import { getDomRefs, updateStatus, renderParticipants, setConnectionState, renderQuestion } from "./utils/dom.js";
import { showMessage } from "./utils/message.js";

const state = {
  editor: null,
  realtime: null,
  socket: null,
  sessionId: null,
};

export async function initializeCollaborationScreen() {
  const refs = getDomRefs();

  renderParticipants(refs, []);
  // Status panel removed; no initial status message

  state.editor = await initializeEditor(refs.editorContainer);
  state.editor?.instance?.layout?.();

  window.addEventListener("resize", () => {
    state.editor?.instance?.layout?.();
  });

  refs.disconnectButton.addEventListener("click", () => {
    handleDisconnect(refs, { manual: true });
  });

  // Auto-connect if sessionId provided in query string
  const params = new URLSearchParams(window.location.search);
  const sid = params.get("sessionId");
  if (sid) {
    await handleConnect(refs);
  }
}

async function handleConnect(refs) {
  if (state.socket) {
    updateStatus(refs, "Already connected to a session", "warning");
    return;
  }

  // Determine sessionId from querystring (preferred) or optional input
  const params = new URLSearchParams(window.location.search);
  const sessionIdFromQuery = params.get("sessionId");
  const sessionIdFromInput = refs.sessionInput?.value?.trim?.() || "";
  const sessionId = sessionIdFromQuery || sessionIdFromInput;
  if (!sessionId) return;

  const user = await resolveUserSession();
  if (!user) {
    updateStatus(refs, "Please sign in before joining a session", "error");
    return;
  }

  setConnectionState(refs, { connected: true });

  let socket;
  try {
    socket = createSessionSocket({
      sessionId,
      onReady: (payload) => {
        state.sessionId = payload.sessionId;
        updateStatus(refs, `Connected to session ${payload.sessionId}`, "success");
        renderParticipants(refs, payload.participants ?? []);
        renderQuestion(refs, payload.question ?? null);

        state.realtime = createRealtimeSession({
          sessionId: payload.sessionId,
          editorContext: state.editor,
          socket,
        });

        // Send initial full content to sync
        try { state.realtime.sendFull(); } catch {}

        state.editor?.instance?.layout?.();
      },
      onParticipants: (participants) => {
        renderParticipants(refs, participants);
      },
      onCursorEvent: (evt) => {
        state.realtime?.onRemoteCursor?.(evt);
      },
      onEditorEvent: (evt) => {
        state.realtime?.onRemoteEvent?.(evt);
      },
      onError: (message) => {
        console.error(message);
        handleDisconnect(refs, { manual: false });
      },
      onDisconnect: (reason) => {
        console.warn(`Disconnected (${reason})`);
        handleDisconnect(refs, { manual: false });
      },
    });
  } catch (error) {
    console.error("Failed to create session socket", error);
    updateStatus(refs, "Unable to connect to collaboration service", "error");
    setConnectionState(refs, { connected: false });
    return;
  }

  state.socket = socket;
  socket.connect();
}

async function handleDisconnect(refs, { manual }) {
  if (!state.socket) {
    setConnectionState(refs, { connected: false });
    return;
  }

  try {
    if (state.sessionId) {
      await fetch(`${COLLAB_CONFIG.httpBase}/sessions/${encodeURIComponent(state.sessionId)}/leave`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }
    state.socket.disconnect();
  } catch (error) {
    console.error("Error disconnecting socket", error);
  }

  if (state.realtime) {
    try {
      state.realtime.destroy();
    } catch (error) {
      console.error("Error tearing down realtime session", error);
    }
  }

  state.socket = null;
  state.realtime = null;
  state.sessionId = null;

  setConnectionState(refs, { connected: false });
  renderParticipants(refs, []);

  updateStatus(refs, manual ? "Disconnected" : "Connection closed", manual ? "info" : "warning");

  // If the user clicked Disconnect, show message then navigate back to dashboard
  if (manual) {
    try {
      showMessage("Left session, redirecting to dashboard...", "success");
      setTimeout(() => {
        window.location.href = COLLAB_CONFIG.routes.dashboard;
      }, 1500);
    } catch {}
  }
}
