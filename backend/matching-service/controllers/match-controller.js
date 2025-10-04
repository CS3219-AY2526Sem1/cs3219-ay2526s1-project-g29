import { enqueueUser, cancelUser, findNearestMatchAndCreateSession, sessions } from "../models/match-model.js";
import { notifyUser } from "../middleware/ws-server.js";

export async function requestMatch(req, res) {
  const { userId, rating } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const numericRating = rating !== undefined ? Number(rating) : 0;
  const user = { userId, rating: numericRating, ts: Date.now() };
  // already queued?
  if (global.waitingUsers && global.waitingUsers.find && global.waitingUsers.find(u => u.userId === userId)) {
    // optional: avoid double enqueue using model's waitingUsers if needed
  }
  const match = findNearestMatchAndCreateSession(user);
  if (match) {
    notifyUser(userId, { type: "MATCHED", sessionId: match.sessionId, partnerId: match.partnerId });
    notifyUser(match.partnerId, { type: "MATCHED", sessionId: match.sessionId, partnerId: userId });
    return res.json({ matched: true, sessionId: match.sessionId, partnerId: match.partnerId });
  }
  enqueueUser(user);
  return res.json({ matched: false, message: "Queued for matching" });
}

export async function cancelMatch(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const removed = cancelUser(userId);
  if (removed) {
    notifyUser(userId, { type: "CANCELLED" });
    return res.json({ cancelled: true });
  }
  return res.status(404).json({ cancelled: false, message: "Not found in queue" });
}

export async function getSession(req, res) {
  const s = sessions[req.params.id];
  if (!s) return res.status(404).json({ error: "Not found" });
  return res.json({ users: s });
}