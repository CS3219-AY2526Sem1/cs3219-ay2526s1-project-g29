const SESSION_KEY_PREFIX = 'collab:session:';

const TTL_SECONDS = 60 * 60; // 1 hour

const noop = () => {};

export class RedisSessionStore {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async addParticipant(sessionId, user) {
    const key = sessionKey(sessionId);
    await this.redis.hset(key, user.id, JSON.stringify(user));
    await this.redis.expire(key, TTL_SECONDS);
    return this.getParticipants(sessionId);
  }

  async removeParticipant(sessionId, userId) {
    const key = sessionKey(sessionId);
    await this.redis.hdel(key, userId);
    const remaining = await this.redis.hlen(key);
    if (remaining === 0) {
      await this.redis.del(key);
      return [];
    }
    return this.getParticipants(sessionId);
  }

  async getParticipants(sessionId) {
    const key = sessionKey(sessionId);
    const participants = await this.redis.hgetall(key);
    return Object.values(participants)
      .map(jsonSafeParse)
      .filter(Boolean);
  }
}

export class InMemorySessionStore {
  constructor() {
    this.sessions = new Map();
  }

  async addParticipant(sessionId, user) {
    const participants = this.sessions.get(sessionId) ?? new Map();
    participants.set(user.id, user);
    this.sessions.set(sessionId, participants);
    return this.getParticipants(sessionId);
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

    return this.getParticipants(sessionId);
  }

  async getParticipants(sessionId) {
    return Array.from((this.sessions.get(sessionId) ?? new Map()).values());
  }
}

export function createSessionManager({
  store,
  messageBus,
  onEmpty = noop,
}) {
  const bus = messageBus ?? { publish: noop };

  async function publishParticipants(sessionId, participants) {
    await safePublish(bus, 'session.participants', {
      sessionId,
      participants,
      timestamp: new Date().toISOString(),
    });

    if (participants.length === 0) {
      onEmpty(sessionId);
    }
  }

  return {
    async join(sessionId, user) {
      const participants = await store.addParticipant(sessionId, user);
      await safePublish(bus, 'session.joined', {
        sessionId,
        user,
        participantsCount: participants.length,
        timestamp: new Date().toISOString(),
      });
      await publishParticipants(sessionId, participants);
      return participants;
    },

    async leave(sessionId, user) {
      const participants = await store.removeParticipant(sessionId, user.id);
      await safePublish(bus, 'session.left', {
        sessionId,
        user,
        participantsCount: participants.length,
        timestamp: new Date().toISOString(),
      });
      await publishParticipants(sessionId, participants);
      return participants;
    },
  };
}

function sessionKey(sessionId) {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

function jsonSafeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function safePublish(bus, routingKey, payload) {
  try {
    await bus.publish(routingKey, payload);
  } catch (error) {
    console.error('[collaboration-service] failed to publish bus event', routingKey, error);
  }
}
