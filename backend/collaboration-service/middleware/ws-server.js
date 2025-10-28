import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env.js';
import { getSession, addParticipant, removeParticipant, closeSession } from '../services/session-store.js';

const socketsBySession = new Map(); // sessionId -> Set<ws>

function extractToken(req, urlObj) {
  // Prefer Authorization header, then cookie, then query param `token`
  const auth = req.headers?.authorization;
  if (auth?.startsWith('Bearer ')) return auth.substring(7);

  const cookie = req.headers?.cookie;
  if (cookie) {
    const token = cookie
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => c.split('='))
      .filter(([name]) => name === 'accessToken')
      .map(([, v]) => v)
      .shift();
    if (token) return token;
  }

  const qp = urlObj.searchParams.get('token');
  return qp ?? null;
}

export function attachWebsocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    // Expect path: /collab/:sessionId
    const url = new URL(req.url, `http://${req.headers.host}`);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length < 2 || segments[0] !== 'collab') {
      ws.close(1008, 'Invalid path');
      return;
    }

    const sessionId = segments[1];
    const token = extractToken(req, url);
    if (!token) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    let user;
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      user = { id: payload.id, username: payload.username ?? payload.email ?? 'anonymous' };
    } catch (e) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    const current = getSession(sessionId);
    if (!current) {
      ws.close(1008, 'Session not found');
      return;
    }

    // Ensure participant registered; allow auto-join if room not full
    const result = addParticipant(sessionId, user);
    if (result.error === 'full') {
      ws.close(1008, 'Session is full');
      return;
    }

    // Track socket in session
    if (!socketsBySession.has(sessionId)) socketsBySession.set(sessionId, new Set());
    const set = socketsBySession.get(sessionId);
    ws.userId = user.id;
    ws.sessionId = sessionId;
    set.add(ws);

    // Notify others of join
    broadcast(sessionId, { type: 'presence', event: 'join', user: { id: user.id, username: user.username } }, ws);
    // Send ready + participants + question to the newly connected user
    try {
      const latest = getSession(sessionId);
      ws.send(
        JSON.stringify({
          type: 'ready',
          sessionId,
          participants: latest?.participants ?? result.session.participants,
          question: latest?.question ?? null,
        })
      );
    } catch {}
    // Broadcast updated participants list to everyone
    broadcast(sessionId, { type: 'participants', participants: result.session.participants });

    ws.on('message', (msg) => {
      // Broadcast messages to the other peer(s)
      broadcast(sessionId, { type: 'message', from: user.id, payload: msg.toString() }, ws);
    });

    ws.on('close', () => {
      set.delete(ws);

      // If this was the last socket for this user in this session, update the store
      const stillConnectedForUser = Array.from(set).some((client) => client.userId === user.id);
      if (!stillConnectedForUser) {
        const { session } = removeParticipant(sessionId, user.id);
        if (session) {
          if (session.participants.length === 0) {
            closeSession(sessionId);
          }
          // Broadcast updated participants list
          broadcast(sessionId, { type: 'participants', participants: session.participants });
        }
      }

      broadcast(sessionId, { type: 'presence', event: 'leave', user: { id: user.id } });
      if (set.size === 0) socketsBySession.delete(sessionId);
    });
  });
}

export function disconnectUserFromSession(sessionId, userId) {
  const set = socketsBySession.get(sessionId);
  if (!set) return 0;
  let count = 0;
  for (const ws of Array.from(set)) {
    if (ws.userId === userId) {
      try { ws.close(1000, 'User left'); } catch {}
      count += 1;
    }
  }
  return count;
}

function broadcast(sessionId, payload, exceptWs = null) {
  const set = socketsBySession.get(sessionId);
  if (!set) return;
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  for (const client of set) {
    if (client !== exceptWs && client.readyState === client.OPEN) client.send(data);
  }
}
