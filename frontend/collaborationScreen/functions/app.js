import { COLLAB_CONFIG } from "./config.js";
import { initializeEditor } from "./services/editor-service.js";
import { createRealtimeSession } from "./services/realtime-service.js";
import { createSessionSocket } from "./services/socket-service.js";
import { resolveUserSession } from "./services/user-service.js";
import { getDomRefs, updateStatus, renderParticipants, setConnectionState } from "./utils/dom.js";

const state = {
  editor: null,
  realtime: null,
  socket: null,
  sessionId: null,
};

export async function initializeCollaborationScreen() {
  const refs = getDomRefs();

  renderParticipants(refs, []);
  updateStatus(refs, "Enter a session ID to begin", "info");

  state.editor = await initializeEditor(refs.editorContainer);
  state.editor?.instance?.layout?.();

  window.addEventListener("resize", () => {
    state.editor?.instance?.layout?.();
  });

  refs.sessionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleConnect(refs);
  });

  refs.disconnectButton.addEventListener("click", () => {
    handleDisconnect(refs, { manual: true });
  });

  // Auto-connect if sessionId provided in query string
  const params = new URLSearchParams(window.location.search);
  const sid = params.get("sessionId");
  if (sid) {
    refs.sessionInput.value = sid;
    await handleConnect(refs);
  }
}

async function handleConnect(refs) {
  if (state.socket) {
    updateStatus(refs, "Already connected to a session", "warning");
    return;
  }

  const sessionId = refs.sessionInput.value.trim();
  if (!sessionId) {
    updateStatus(refs, "Session ID is required", "error");
    return;
  }

  const user = await resolveUserSession();
  if (!user) {
    updateStatus(refs, "Please sign in before joining a session", "error");
    return;
  }

  updateStatus(refs, "Connecting to session...", "info");
  setConnectionState(refs, { connected: true });

  let socket;
  try {
    socket = createSessionSocket({
      sessionId,
      onReady: (payload) => {
        state.sessionId = payload.sessionId;
        updateStatus(refs, `Connected to session ${payload.sessionId}`, "success");
        renderParticipants(refs, payload.participants ?? []);

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
        if (Array.isArray(participants)) {
          if (participants.length >= 2) {
            updateStatus(refs, "Paired: both collaborators connected", "success");
          } else if (participants.length === 1) {
            updateStatus(refs, "Waiting for collaborator...", "info");
          }
        }
      },
      onCursorEvent: (evt) => {
        state.realtime?.onRemoteCursor?.(evt);
      },
      onEditorEvent: (evt) => {
        state.realtime?.onRemoteEvent?.(evt);
      },
      onError: (message) => {
        updateStatus(refs, message, "error");
        handleDisconnect(refs, { manual: false });
      },
      onDisconnect: (reason) => {
        updateStatus(refs, `Disconnected (${reason})`, "warning");
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
}
