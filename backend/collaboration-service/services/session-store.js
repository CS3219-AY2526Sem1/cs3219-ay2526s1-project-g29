const SESSION_KEY_PREFIX = 'collab:session:';

function sessionKey(sessionId) {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

export class SessionStore {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async addParticipant(sessionId, user) {
    const key = sessionKey(sessionId);
    await this.redis.hset(key, user.id, JSON.stringify(user));
    await this.redis.expire(key, 60 * 60);
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
    return Object.values(participants).map((participant) => {
      try {
        return JSON.parse(participant);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  }
}
