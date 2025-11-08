import { env } from '../utils/env.js';
import { createSessionWithId, getSession, removeParticipant, closeSession } from '../services/session-store.js';
import { toPublicSession } from '../models/session-model.js';
import { disconnectUserFromSession } from '../middleware/ws-server.js';
import axios from 'axios';

function checkInternalAuth(req) {
  const token = req.headers['x-internal-token'] || req.headers['X-Internal-Token'];
  return token && token === env.internalApiToken;
}

export function matchFoundHandler(req, res) {
  if (!checkInternalAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { sessionId, users, id: legacyId, participants: legacyParticipants, question } = req.body || {};
  const id = sessionId ?? legacyId;
  const participants = users ?? legacyParticipants;

  if (!id || typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ message: 'id is required' });
  }

  const result = createSessionWithId(id, participants, question);
  if (result.error === 'exists') {
    return res.status(200).json({ session: toPublicSession(result.session), created: false });
  }

  return res.status(201).json({ session: toPublicSession(result.session), created: true });
}

export function getSessionHandler(req, res) {
  if (!checkInternalAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { id } = req.params;
  const s = getSession(id);
  if (!s) return res.status(404).json({ message: 'session not found' });
  return res.status(200).json({ session: toPublicSession(s) });
}

export async function autosaveHandler(req, res) {
  const { id } = req.params;
  const user = req.user;
  const { code, language = 'javascript' } = req.body;

  const s = getSession(id);
  if (!s) return res.status(404).json({ message: 'session not found' });

  try {
    await axios.post(`${env.historyServiceUrl}/api/history/saveHistory`, {
      sessionId: id,
      userId: user.id,
      username: user.username || user.email || 'anonymous',
      questionId: s.question?.id,
      submittedCode: code || '',
      language
    }, {
      timeout: 5000
    });

    return res.status(200).json({ message: 'autosaved' });
  } catch (error) {
    console.error('Failed to autosave:', error.message);
    return res.status(500).json({ message: 'autosave failed' });
  }
}

// Authenticated user proactively leaves a session
export async function leaveSessionHandler(req, res) {
  const { id } = req.params; // session id
  const user = req.user; // set by requireAuth middleware
  const { code, language = 'javascript' } = req.body;

  const s = getSession(id);
  if (!s) return res.status(404).json({ message: 'session not found' });

  try {
    await axios.post(`${env.historyServiceUrl}/api/history/saveHistory`, {
      sessionId: id,
      userId: user.id,
      username: user.username || 'anonymous',
      questionId: s.question?.id,
      submittedCode: code || '',
      language
    }, {
      timeout: 5000
    });

    console.log(`Saved history for user ${user.id} in session ${id}`);
  } catch (error) {
    console.error('Failed to save history:', error.message);
    // Don't fail the disconnect if history save fails
  }

  // Remove participant from store
  removeParticipant(id, user.id);

  // Disconnect any active sockets for this user in this session
  disconnectUserFromSession(id, user.id);

  const updated = getSession(id);
  if (!updated || updated.participants.length === 0) {
    closeSession(id);
    return res.status(200).json({ message: 'left and session closed' });
  }

  return res.status(200).json({ message: 'left', session: toPublicSession(updated) });
}
