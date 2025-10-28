function getElement(id, optional = false) {
  const el = document.getElementById(id);
  if (!el && !optional) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return el || null;
}

export function getDomRefs() {
  return {
    // Optional (removed from new layout)
    sessionForm: getElement("sessionForm", true),
    sessionInput: getElement("sessionId", true),
    connectButton: getElement("connectBtn", true),
    statusText: getElement("statusText", true),
    // Required
    disconnectButton: getElement("disconnectBtn"),
    participantsList: getElement("participantsList"),
    editorContainer: getElement("editorContainer"),
    questionContainer: getElement("questionContainer", true),
  };
}

export function updateStatus(refs, message, tone = "info") {
  if (!refs.statusText) return; // Status UI removed in new layout
  refs.statusText.textContent = message;
  refs.statusText.dataset.tone = tone;
}

export function renderParticipants(refs, participants = []) {
  refs.participantsList.innerHTML = "";
  if (!participants.length) {
    const empty = document.createElement("li");
    empty.textContent = "Waiting for collaborators...";
    empty.classList.add("empty-state");
    refs.participantsList.appendChild(empty);
    return;
  }

  participants.forEach((participant) => {
    const item = document.createElement("li");
    const displayName = participant.username || participant.email || "anonymous";
    item.textContent = displayName;
    refs.participantsList.appendChild(item);
  });
}

export function setConnectionState(refs, { connected }) {
  if (refs.connectButton) refs.connectButton.disabled = connected;
  if (refs.sessionInput) refs.sessionInput.disabled = connected;
  refs.disconnectButton.disabled = !connected;
}
