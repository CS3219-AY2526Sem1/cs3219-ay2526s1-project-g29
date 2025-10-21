import Redis from 'ioredis';
import { env } from './env.js';

function createRedisClients() {
  const connection = env.redis.url ?? env.redis;
  const commonOptions = { lazyConnect: true };

  const pubClient = new Redis(connection, commonOptions);
  const subClient = new Redis(connection, commonOptions);

  return { pubClient, subClient };
}

export const redisClients = createRedisClients();
