function getElement(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return el;
}

export function getDomRefs() {
  return {
    sessionForm: getElement("sessionForm"),
    sessionInput: getElement("sessionId"),
    connectButton: getElement("connectBtn"),
    disconnectButton: getElement("disconnectBtn"),
    statusText: getElement("statusText"),
    participantsList: getElement("participantsList"),
    editorContainer: getElement("editorContainer"),
  };
}

export function updateStatus(refs, message, tone = "info") {
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
    const displayName = participant.username || participant.email || `User ${participant.id.slice(0, 6)}`;
    const identifier = participant.id.slice(0, 8);
    item.innerHTML = `
      <span>${displayName}</span>
      <small>${identifier}</small>
    `;
    refs.participantsList.appendChild(item);
  });
}

export function setConnectionState(refs, { connected }) {
  refs.connectButton.disabled = connected;
  refs.sessionInput.disabled = connected;
  refs.disconnectButton.disabled = !connected;
}
