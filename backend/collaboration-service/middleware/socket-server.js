import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';

import { SessionStore } from '../services/session-store.js';
import { NoopMessageBus } from '../services/message-bus.js';
import { maybeCleanupDocument } from '../services/document-service.js';

class InMemorySessionStore {
  constructor() {
    this.sessions = new Map();
  }

  async addParticipant(sessionId, user) {
    const participants = this.sessions.get(sessionId) ?? new Map();
    participants.set(user.id, user);
    this.sessions.set(sessionId, participants);
    return Array.from(participants.values());
  }

  async removeParticipant(sessionId, userId) {
    const participants = this.sessions.get(sessionId);
    if (!participants) {
      return [];
    }
    participants.delete(userId);
    if (participants.size === 0) {
      this.sessions.delete(sessionId);
      return [];
    }
    return Array.from(participants.values());
  }

  async getParticipants(sessionId) {
    return Array.from(
      (this.sessions.get(sessionId) ?? new Map()).values(),
    );
  }
}

const EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  SESSION_JOIN: 'session:join',
  SESSION_READY: 'session:ready',
  SESSION_LEAVE: 'session:leave',
  SESSION_PARTICIPANTS: 'session:participants',
  ERROR: 'session:error',
};

function getTokenFromHandshake(handshake) {
  const authToken = handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  const header = handshake.headers?.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.substring(7);
  }

  const cookieHeader = handshake.headers?.cookie;
  if (cookieHeader) {
    const tokenFromCookie = extractTokenFromCookie(cookieHeader);
    if (tokenFromCookie) {
      return tokenFromCookie;
    }
  }

  return null;
}

function extractTokenFromCookie(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => cookie.split('='))
    .filter(([name]) => name === 'accessToken')
    .map(([, value]) => value)
    .shift() ?? null;
}

export function createSocketServer(httpServer, options = {}) {
  const io = new Server(httpServer, {
    cors: {
      origin: options.corsOrigins ?? [],
      credentials: true,
    },
  });

  if (options.redisClients) {
    const { pubClient, subClient } = options.redisClients;
    io.adapter(createAdapter(pubClient, subClient));
  }

  const sessionStore = options.redisClients?.pubClient
    ? new SessionStore(options.redisClients.pubClient)
    : new InMemorySessionStore();

  const messageBus = options.messageBus ?? new NoopMessageBus();

  async function broadcastParticipants(sessionId, participants) {
    io.to(sessionId).emit(EVENTS.SESSION_PARTICIPANTS, {
      sessionId,
      participants,
    });

    try {
      await messageBus.publish('session.participants', {
        sessionId,
        participants,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[collaboration-service] failed to publish participants update', error);
    }

    if (participants.length === 0) {
      maybeCleanupDocument(sessionId);
    }
  }

  io.use((socket, next) => {
    try {
      const token = getTokenFromHandshake(socket.handshake);
      if (!token) {
        return next(new Error('Authentication token missing'));
      }
      const payload = jwt.verify(token, options.jwtSecret);
      socket.data.user = {
        id: payload.id,
        username: payload.username ?? payload.email ?? 'anonymous',
      };
      socket.data.sessions = new Set();
      return next();
    } catch (err) {
      return next(new Error('Authentication failed'));
    }
  });

  io.on(EVENTS.CONNECTION, (socket) => {
    socket.on(EVENTS.SESSION_JOIN, async ({ sessionId, username }) => {
      try {
        if (!sessionId) {
          socket.emit(EVENTS.ERROR, { message: 'sessionId is required' });
          return;
        }

        socket.join(sessionId);
        socket.data.sessions.add(sessionId);

        if (username) {
          socket.data.user.username = username;
        }

        const participants = await sessionStore.addParticipant(sessionId, {
          id: socket.data.user.id,
          username: socket.data.user.username,
        });

        await broadcastParticipants(sessionId, participants);

        socket.emit(EVENTS.SESSION_READY, {
          sessionId,
          participants,
        });

        try {
          await messageBus.publish('session.joined', {
            sessionId,
            user: socket.data.user,
            participantsCount: participants.length,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('[collaboration-service] failed to publish session join', error);
        }
      } catch (error) {
        socket.emit(EVENTS.ERROR, { message: error.message });
      }
    });

    socket.on(EVENTS.SESSION_LEAVE, async ({ sessionId }) => {
      if (!sessionId) {
        return;
      }

      socket.leave(sessionId);
      socket.data.sessions.delete(sessionId);
      const participants = await sessionStore.removeParticipant(
        sessionId,
        socket.data.user.id,
      );

      await broadcastParticipants(sessionId, participants);

      try {
        await messageBus.publish('session.left', {
          sessionId,
          user: socket.data.user,
          participantsCount: participants.length,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[collaboration-service] failed to publish session leave', error);
      }
    });

    socket.on(EVENTS.DISCONNECT, async () => {
      for (const sessionId of socket.data.sessions) {
        const participants = await sessionStore.removeParticipant(
          sessionId,
          socket.data.user.id,
        );

        await broadcastParticipants(sessionId, participants);

        try {
          await messageBus.publish('session.disconnected', {
            sessionId,
            user: socket.data.user,
            participantsCount: participants.length,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('[collaboration-service] failed to publish session disconnect', error);
        }
      }
    });
  });

  return io;
}
