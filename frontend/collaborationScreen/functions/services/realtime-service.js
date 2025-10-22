// Minimal realtime adapter using our plain WebSocket backend.
// Strategy: broadcast full text updates, throttled. Avoid feedback loops with a guard flag.

export function createRealtimeSession({ sessionId, editorContext, socket }) {
  const { instance, model } = editorContext;

  let version = 0;
  let isApplyingRemote = false;
  let lastSentContent = model.getValue();
  const remoteDecorations = new Map(); // userId -> decorationIds

  function sendUpdate() {
    const content = model.getValue();
    if (content === lastSentContent) return;
    lastSentContent = content;
    version += 1;
    socket.send({ type: "editor-update", sessionId, version, content });
  }

  // Throttle sends to avoid spamming
  let scheduled = null;
  function scheduleSend() {
    if (scheduled) return;
    scheduled = setTimeout(() => {
      scheduled = null;
      sendUpdate();
    }, 120);
  }

  const disposeContentListener = model.onDidChangeContent(() => {
    if (isApplyingRemote) return;
    scheduleSend();
  });

  // Send cursor/selection presence updates (throttled)
  let cursorScheduled = null;
  const sendCursor = () => {
    const sel = instance.getSelection();
    const selection = sel
      ? {
          startLineNumber: sel.startLineNumber,
          startColumn: sel.startColumn,
          endLineNumber: sel.endLineNumber,
          endColumn: sel.endColumn,
        }
      : null;
    socket.send({ type: 'cursor', selection });
  };
  const scheduleCursor = () => {
    if (cursorScheduled) return;
    cursorScheduled = setTimeout(() => {
      cursorScheduled = null;
      sendCursor();
    }, 150);
  };
  const disposeCursorListener = instance.onDidChangeCursorSelection(() => {
    scheduleCursor();
  });

  function applyRemoteUpdate({ content }) {
    if (typeof content !== "string") return;
    if (content === model.getValue()) return;
    isApplyingRemote = true;
    try {
      const fullRange = model.getFullModelRange();
      instance.executeEdits("remote", [
        { range: fullRange, text: content, forceMoveMarkers: true },
      ]);
      instance.pushUndoStop();
    } finally {
      isApplyingRemote = false;
      lastSentContent = model.getValue();
    }
  }

  function setRemoteSelection(userId, selection) {
    // Remove previous decorations
    const prev = remoteDecorations.get(userId) || [];
    try { model.deltaDecorations(prev, []); } catch {}

    if (!selection) {
      remoteDecorations.set(userId, []);
      return;
    }

    const {
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    } = selection;
    const newDecos = model.deltaDecorations([], [
      {
        range: {
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
        },
        options: {
          className: 'remote-selection',
          stickiness: 1,
          isWholeLine: false,
        },
      },
    ]);
    remoteDecorations.set(userId, newDecos);
  }

  return {
    connect() {
      // No-op: socket is already connected by caller
    },
    disconnect() {
      // No-op
    },
    destroy() {
      try { disposeContentListener.dispose?.(); } catch {}
      try { disposeCursorListener.dispose?.(); } catch {}
      // Clear all remote decorations
      for (const ids of remoteDecorations.values()) {
        try { model.deltaDecorations(ids, []); } catch {}
      }
      remoteDecorations.clear();
    },
    sendFull() {
      // Force send the entire content immediately
      lastSentContent = null;
      sendUpdate();
    },
    onRemoteEvent(msg) {
      if (msg?.type === "editor-update") {
        applyRemoteUpdate(msg);
      }
    },
    onRemoteCursor(msg) {
      // msg: { type:'cursor', selection?: {...}, from?: userId }
      const userId = msg.from;
      const selection = msg.selection;
      if (!userId) return;
      setRemoteSelection(userId, selection);
    },
  };
}
