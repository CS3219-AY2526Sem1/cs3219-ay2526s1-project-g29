import 'dotenv/config';

const DEFAULT_PORT = 8001;
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function parseCorsOrigins() {
  const extraOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...extraOrigins, ...DEFAULT_CORS_ORIGINS])];
}

function parseRedisOptions() {
  const url = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = Number(process.env.REDIS_PORT ?? 6379);

  return url
    ? { url }
    : {
      host,
      port,
    };
}

function parseRabbitMQOptions() {
  return {
    url:
      process.env.RABBITMQ_URL ?? 'amqp://admin:admin@localhost:5672',
    exchange:
      process.env.RABBITMQ_EXCHANGE ?? 'collaboration_exchange',
  };
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Support COLLAB_PORT first (to match compose), then PORT, then default
  port: Number(process.env.COLLAB_PORT ?? process.env.PORT ?? DEFAULT_PORT),
  corsOrigins: parseCorsOrigins(),
  jwtSecret: process.env.JWT_SECRET ?? 'development-secret',
  redis: parseRedisOptions(),
  rabbitmq: parseRabbitMQOptions(),
  internalApiToken: process.env.COLLAB_INTERNAL_TOKEN ?? 'dev-internal-token',
  historyServiceUrl: process.env.HISTORY_SERVICE_URL ?? 'http://localhost:8005',
};
