import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

import {
  RedisSessionStore,
  InMemorySessionStore,
  createSessionManager,
} from '../controllers/session-controller.js';
import { NoopMessageBus } from '../utils/message-bus.js';
import { maybeCleanupDocument } from '../controllers/editor-controller.js';
import { extractToken, resolveUserFromToken } from './auth.js';

const EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  SESSION_JOIN: 'session:join',
  SESSION_READY: 'session:ready',
  SESSION_LEAVE: 'session:leave',
  SESSION_PARTICIPANTS: 'session:participants',
  ERROR: 'session:error',
};

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

  const store = options.redisClients?.pubClient
    ? new RedisSessionStore(options.redisClients.pubClient)
    : new InMemorySessionStore();

  const messageBus = options.messageBus ?? new NoopMessageBus();

  const sessionManager = createSessionManager({
    store,
    messageBus,
    onEmpty: maybeCleanupDocument,
  });

  io.use((socket, next) => {
    try {
      const token = extractToken(socket.handshake);
      if (!token) {
        return next(new Error('Authentication token missing'));
      }
      socket.data.user = resolveUserFromToken(token, options.jwtSecret);
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

        const participants = await sessionManager.join(sessionId, {
          id: socket.data.user.id,
          username: socket.data.user.username,
        });

        io.to(sessionId).emit(EVENTS.SESSION_PARTICIPANTS, {
          sessionId,
          participants,
        });

        socket.emit(EVENTS.SESSION_READY, {
          sessionId,
          participants,
        });
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
      const participants = await sessionManager.leave(sessionId, socket.data.user);

      io.to(sessionId).emit(EVENTS.SESSION_PARTICIPANTS, {
        sessionId,
        participants,
      });
    });

    socket.on(EVENTS.DISCONNECT, async () => {
      for (const sessionId of socket.data.sessions) {
        const participants = await sessionManager.leave(sessionId, socket.data.user);

        io.to(sessionId).emit(EVENTS.SESSION_PARTICIPANTS, {
          sessionId,
          participants,
        });

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
