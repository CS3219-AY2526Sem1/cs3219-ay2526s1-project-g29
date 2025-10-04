// Currently completely in memory, to explore redis/rabbitmq later
export const waitingUsers = []; // [{ userId, rating, ts }]
export const sessions = {}; // { sessionId: [u1, u2] }
export let sessionIdCounter = 1;

export function enqueueUser(user) {
  waitingUsers.push(user);
}

export function cancelUser(userId) {
  const idx = waitingUsers.findIndex((u) => u.userId === userId);
  if (idx >= 0) {
    waitingUsers.splice(idx, 1);
    return true;
  }
  return false;
}

export function findNearestMatchAndCreateSession(user) { // TODO THIS IS PLACEHOLDER IMPLEMENTATION
  if (waitingUsers.length === 0) return null;
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < waitingUsers.length; i++) {
    const cand = waitingUsers[i];
    if (cand.userId === user.userId) continue;
    const diff = Math.abs((cand.rating || 0) - (user.rating || 0));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  if (bestIdx >= 0) {
    const partner = waitingUsers.splice(bestIdx, 1)[0];
    const sessionId = `session-${sessionIdCounter++}`;
    sessions[sessionId] = [user.userId, partner.userId];
    return { sessionId, partnerId: partner.userId };
  }
  return null;
}