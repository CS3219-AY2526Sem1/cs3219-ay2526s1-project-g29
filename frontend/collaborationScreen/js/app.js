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
      user,
      onReady: (payload) => {
        state.realtime = createRealtimeSession({
          sessionId: payload.sessionId,
          user,
          editorContext: state.editor,
        });

        state.realtime.connect();

        state.sessionId = payload.sessionId;
        updateStatus(refs, `Connected to session ${payload.sessionId}`, "success");
        renderParticipants(refs, payload.participants ?? []);

        state.editor?.instance?.layout?.();
      },
      onParticipants: (participants) => {
        renderParticipants(refs, participants);
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

function handleDisconnect(refs, { manual }) {
  if (!state.socket) {
    setConnectionState(refs, { connected: false });
    return;
  }

  try {
    if (state.sessionId) {
      state.socket.emit("session:leave", { sessionId: state.sessionId });
    }
    state.socket.disconnect();
  } catch (error) {
    console.error("Error disconnecting socket", error);
  }

  if (state.realtime) {
    try {
      state.realtime.disconnect();
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

  updateStatus(
    refs,
    manual ? "Disconnected" : "Connection closed",
    manual ? "info" : "warning"
  );
}
