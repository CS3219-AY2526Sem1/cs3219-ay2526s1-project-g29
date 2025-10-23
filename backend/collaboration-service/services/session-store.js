import { v4 as uuidv4 } from 'uuid';

// In-memory store. Replace with DB if needed later.
const sessions = new Map(); // id -> { id, participants: [{ id, username }], status, createdAt }

export function createSessionWithId(id, participants = []) {
  if (sessions.has(id)) {
    return { error: 'exists', session: sessions.get(id) };
  }
  const normalizedParticipants = (participants || [])
    .filter(Boolean)
    .map((p) => ({ id: p.id, username: p.username ?? 'anonymous' }));
  const status = normalizedParticipants.length >= 2 ? 'active' : 'waiting';
  const session = {
    id,
    participants: normalizedParticipants.slice(0, 2),
    status,
    createdAt: new Date().toISOString(),
  };
  sessions.set(id, session);
  return { session };
}

export function getSession(id) {
  return sessions.get(id) ?? null;
}

export function addParticipant(id, user) {
  const s = sessions.get(id);
  if (!s) return { error: 'not_found' };

  const idx = s.participants.findIndex((p) => p.id === user.id);
  if (idx !== -1) {
    // Update username if we have a better one than the placeholder
    const current = s.participants[idx];
    const supplied = user.username ?? null;
    if (supplied && (!current.username || current.username === 'anonymous')) {
      s.participants[idx] = { ...current, username: supplied };
    }
    return { session: s };
  }

  if (s.participants.length >= 2) return { error: 'full' };

  s.participants.push({ id: user.id, username: user.username ?? 'anonymous' });
  if (s.participants.length === 2) s.status = 'active';
  return { session: s };
}

export function removeParticipant(id, userId) {
  const s = sessions.get(id);
  if (!s) return { error: 'not_found' };
  const before = s.participants.length;
  s.participants = s.participants.filter((p) => p.id !== userId);
  if (s.participants.length === 0) s.status = 'waiting';
  return { removed: before !== s.participants.length, session: s };
}

export function closeSession(id) {
  return sessions.delete(id);
}
