import { COLLAB_CONFIG } from "./config.js";
import { initializeEditor, setEditorLanguage } from "./services/editor-service.js";
import { createRealtimeSession } from "./services/realtime-service.js";
import { createSessionSocket } from "./services/socket-service.js";
import { resolveUserSession } from "./services/user-service.js";
import { getDomRefs, updateStatus, renderParticipants, setConnectionState, renderQuestion } from "./utils/dom.js";
import { showMessage, hideMessage } from "./utils/message.js";
import { initializeAIPanel } from "./utils/ai-panel.js";
import { initializeChat, handleChatMessage, cleanupChat } from "./utils/chat.js";

const state = {
  editor: null,
  realtime: null,
  socket: null,
  sessionId: null,
  participants: [],
  currentUser: null,
  partnerConnected: false,
  partnerJoinTimer: null,
  disconnecting: false,
  language: COLLAB_CONFIG.defaultLanguage,
  langPending: null, // { requestedBy: 'me'|'partner', language, partnerName }
};

export async function initializeCollaborationScreen() {
  const refs = getDomRefs();

  renderParticipants(refs, []);

  state.editor = await initializeEditor(refs.editorContainer);
  state.editor?.instance?.layout?.();

  if (state.editor?.instance) {
    initializeAIPanel(state.editor.instance);
  }

  window.addEventListener("resize", () => {
    state.editor?.instance?.layout?.();
  });

  refs.disconnectButton.addEventListener("click", () => {
    handleDisconnect(refs, { manual: true });
  });

  // Language selection
  if (refs.languageSelect) {
    refs.languageSelect.value = state.language;
    refs.languageSelect.addEventListener('change', () => {
      const lang = refs.languageSelect.value;
      onLocalLanguageSelected(refs, lang);
    });
  }

  try {
    const bc = new BroadcastChannel('auth');
    bc.onmessage = (e) => {
      if (e?.data?.type === 'logout') {
        handleLoggedOut(refs);
      }
    };
  } catch {}
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth:logout') {
      handleLoggedOut(refs);
    }
  });

  if (refs.partnerLeftYesBtn) {
    refs.partnerLeftYesBtn.addEventListener("click", () => {
      hidePartnerLeftPrompt(refs);
    });
  }
  if (refs.partnerLeftNoBtn) {
    refs.partnerLeftNoBtn.addEventListener("click", () => {
      hidePartnerLeftPrompt(refs);
      handleDisconnect(refs, { manual: true });
    });
  }

  // Language request
  if (refs.langAcceptBtn) {
    refs.langAcceptBtn.addEventListener('click', () => {
      if (!state.langPending || state.langPending.requestedBy !== 'partner') return;
      const language = state.langPending.language;
      const payload = { type: 'language-response', accepted: true, language, username: state.currentUser?.username };
      try { state.socket?.send(payload); } catch {}
      refs.langRequestModal?.classList.add('hidden');
      applyLanguageChange(refs, language);
      showMessage(`Language changed to ${language}.`, 'success');
      setTimeout(() => hideMessage(), 3000);
      state.langPending = null;
    });
  }
  if (refs.langRejectBtn) {
    refs.langRejectBtn.addEventListener('click', () => {
      if (!state.langPending || state.langPending.requestedBy !== 'partner') return;
      const language = state.langPending.language;
      const payload = { type: 'language-response', accepted: false, language, username: state.currentUser?.username };
      try { state.socket?.send(payload); } catch {}
      refs.langRequestModal?.classList.add('hidden');
      state.langPending = null;
    });
  }

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
  state.currentUser = user;

  setConnectionState(refs, { connected: true });

  let socket;
  try {
    socket = createSessionSocket({
      sessionId,
      onReady: (payload) => {
        state.sessionId = payload.sessionId;
        updateStatus(refs, `Connected to session ${payload.sessionId}`, "success");
        state.participants = payload.participants ?? [];
        renderParticipants(refs, state.participants);
        renderQuestion(refs, payload.question ?? null);

        state.realtime = createRealtimeSession({
          sessionId: payload.sessionId,
          editorContext: state.editor,
          socket,
        });

        // Send initial full content to sync
        try { state.realtime.sendFull(); } catch {}

        state.editor?.instance?.layout?.();

        const meId = state.currentUser?.id;
        const other = (state.participants || []).find((p) => p.id !== meId);
        state.partnerConnected = Boolean(other && other.username && other.username !== 'anonymous');

        // Grace period for partner to join; if they don't, redirect back
        if (state.partnerJoinTimer) { try { clearTimeout(state.partnerJoinTimer); } catch {} }
        if (!state.partnerConnected) {
          state.partnerJoinTimer = setTimeout(() => {
            if (!state.partnerConnected && !state.disconnecting) {
              handleDisconnect(refs, { manual: true, message: 'Your partner left the session. Redirecting to dashboard...' });
            }
          }, 1500);
        }

        // Initialize chat after connection
        initializeChat(socket, user.id);
      },
      onParticipants: (participants) => {
        const prev = Array.isArray(state.participants) ? state.participants : [];
        const next = Array.isArray(participants) ? participants : [];

        // Detect a participant leaving AFTER we had both connected
        if (state.partnerConnected && prev.length > next.length && next.length >= 1) {
          const removed = prev.find((p) => !next.some((n) => n.id === p.id));
          const display = removed?.username || "Your partner";
          showPartnerLeftPrompt(refs, display);
        }

        state.participants = next;
        renderParticipants(refs, next);
      },
      onControlEvent: (evt) => {
        handleControlEvent(refs, evt);
      },
      onPresence: (evt) => {
        if (evt?.event === 'join') {
          const joinerId = evt?.user?.id;
          if (joinerId && joinerId !== state.currentUser?.id) {
            state.partnerConnected = true;
            if (state.partnerJoinTimer) { try { clearTimeout(state.partnerJoinTimer); } catch {} }
            state.partnerJoinTimer = null;
          }
        }
        if (evt?.event === 'leave') {
          const leaverId = evt?.user?.id;
          if (leaverId && leaverId !== state.currentUser?.id) {
            // Partner left explicitly
            showPartnerLeftPrompt(refs, 'Your partner');
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
        console.error(message);
        handleDisconnect(refs, { manual: false });
      },
      onDisconnect: (reason) => {
        console.warn(`Disconnected (${reason})`);
        const r = String(reason || '').toLowerCase();
        if (r.includes('partner') || r.includes('timeout') || r.includes('closed')) {
          handleDisconnect(refs, { manual: true, message: 'Your partner left the session. Redirecting to dashboard...' });
        } else {
          handleDisconnect(refs, { manual: false });
        }
      },
      // Add onChatMessage handler
      onChatMessage: (data) => {
        handleChatMessage(data);
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

async function handleDisconnect(refs, { manual, message, redirectTo }) {
  if (state.disconnecting) return;
  state.disconnecting = true;
  if (state.partnerJoinTimer) { try { clearTimeout(state.partnerJoinTimer); } catch {} }
  state.partnerJoinTimer = null;
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

  // Cleanup chat
  cleanupChat();

  state.socket = null;
  state.realtime = null;
  state.sessionId = null;
  state.partnerConnected = false;

  setConnectionState(refs, { connected: false });
  renderParticipants(refs, []);

  updateStatus(refs, manual ? "Disconnected" : "Connection closed", manual ? "info" : "warning");

  // If the user clicked Disconnect, show message then navigate
  if (manual) {
    try {
      const msg = message || "Left session, redirecting to dashboard...";
      showMessage(msg, "success");
      setTimeout(() => {
        const target = redirectTo === 'login' ? COLLAB_CONFIG.routes.login : COLLAB_CONFIG.routes.dashboard;
        window.location.href = target;
      }, 1500);
    } catch {}
  }
  state.disconnecting = false;
}

function showPartnerLeftPrompt(refs, displayName) {
  if (!refs.partnerLeftModal) return;
  const textEl = refs.partnerLeftText;
  if (textEl) {
    textEl.textContent = `${displayName} has left the session. Continue?`;
  }
  refs.partnerLeftModal.classList.remove("hidden");
}

function hidePartnerLeftPrompt(refs) {
  if (!refs.partnerLeftModal) return;
  refs.partnerLeftModal.classList.add("hidden");
}

function handleLoggedOut(refs) {
  // For user A logging out in another tab while connected
  handleDisconnect(refs, { manual: true, message: 'Session ended: you were logged out. Redirecting to login…', redirectTo: 'login' });
}

function onLocalLanguageSelected(refs, language) {
  if (state.langPending || language === state.language) {
    if (refs.languageSelect) refs.languageSelect.value = state.language;
    return;
  }
  // Request partner confirmation
  const username = state.currentUser?.username || 'You';
  try {
    state.socket?.send({ type: 'language-request', language, from: state.currentUser?.id, username });
    state.langPending = { requestedBy: 'me', language };
    if (refs.languageSelect) refs.languageSelect.disabled = true;
    refs.langWaitingModal?.classList.remove('hidden');
  } catch (e) {
    console.error('Failed to send language request', e);
    if (refs.languageSelect) refs.languageSelect.value = state.language;
  }
}

function handleControlEvent(refs, evt) {
  switch (evt?.type) {
    case 'language-request': {
      const fromId = evt.from;
      const fromName = evt.username || 'Your partner';
      const language = evt.language;
      if (!fromId || fromId === state.currentUser?.id) return; // ignore our own
      if (state.langPending) return; // already handling a request
      state.langPending = { requestedBy: 'partner', language, partnerName: fromName, fromId };
      if (refs.langRequestText) {
        refs.langRequestText.textContent = `${fromName} wants to change the language to ${language}. Accept?`;
      }
      refs.langRequestModal?.classList.remove('hidden');
      break;
    }
    case 'language-response': {
      if (!state.langPending || state.langPending.requestedBy !== 'me') return;
      const { accepted, language, username } = evt;
      refs.langWaitingModal?.classList.add('hidden');
      if (accepted) {
        applyLanguageChange(refs, language);
        // Inform partner
        try { state.socket?.send({ type: 'language-change', language }); } catch {}
        showMessage(`Language changed to ${language}.`, 'success');
        setTimeout(() => hideMessage(), 3000);
      } else {
        showMessage(`${username || 'Your partner'} has rejected the language change.`, 'error');
        setTimeout(() => hideMessage(), 3000);
        if (refs.languageSelect) {
          refs.languageSelect.disabled = false;
          refs.languageSelect.value = state.language;
        }
      }
      state.langPending = null;
      break;
    }
    case 'language-change': {
      const language = evt.language;
      applyLanguageChange(refs, language);
      showMessage(`Language changed to ${language}.`, 'success');
      setTimeout(() => hideMessage(), 3000);
      break;
    }
  }
}

function applyLanguageChange(refs, language) {
  const ok = setEditorLanguage(state.editor, language);
  if (ok) {
    state.language = language;
    if (refs.languageSelect) {
      refs.languageSelect.disabled = false;
      refs.languageSelect.value = language;
    }
  }
}
