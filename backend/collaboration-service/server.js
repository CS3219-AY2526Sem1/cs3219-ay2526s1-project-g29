import http from 'http';
import { createRequire } from 'node:module';
import { URL } from 'node:url';

import { WebSocketServer } from 'ws';

import { app } from './app.js';
import { env } from './utils/env.js';
import { redisClients } from './utils/redis.js';
import { connectRabbitMQ, closeRabbitMQ } from './utils/rabbitmq.js';
import { createSocketServer } from './middleware/web_socket_server.js';
import { MessageBus, NoopMessageBus } from './utils/message-bus.js';
import { ensureDocument } from './controllers/editor-controller.js';
import {
  extractTokenFromCookie,
  resolveUserFromToken,
} from './middleware/auth.js';

const require = createRequire(import.meta.url);
const { setupWSConnection } = require('y-websocket/bin/utils');

const server = http.createServer(app);
const editorWsServer = new WebSocketServer({ noServer: true });

let activeRedisClients = null;
let rabbitContext = null;
let activeMessageBus = new NoopMessageBus();

async function bootstrap() {
  let adapterClients = null;

  try {
    const { pubClient, subClient } = redisClients;
    await Promise.all([pubClient.connect(), subClient.connect()]);
    adapterClients = redisClients;
    activeRedisClients = redisClients;
    console.log('[collaboration-service] connected to Redis');
  } catch (error) {
    console.warn(
      '[collaboration-service] Redis not available, falling back to in-memory session store',
      error.message ?? error,
    );
  }

  try {
    rabbitContext = await connectRabbitMQ();
    activeMessageBus = new MessageBus(
      rabbitContext.channel,
      rabbitContext.exchange,
    );
    console.log('[collaboration-service] connected to RabbitMQ');
  } catch (error) {
    console.warn(
      '[collaboration-service] RabbitMQ not available, skipping message bus integration',
      error.message ?? error,
    );
    rabbitContext = null;
    activeMessageBus = new NoopMessageBus();
  }

  createSocketServer(server, {
    corsOrigins: env.corsOrigins,
    redisClients: adapterClients,
    jwtSecret: env.jwtSecret,
    messageBus: activeMessageBus,
  });

  server.listen(env.port, () => {
    console.log(
      `[collaboration-service] listening on http://localhost:${env.port} in ${env.nodeEnv} mode`
    );
  });
}

async function shutdown(signal) {
  console.log(`[collaboration-service] received ${signal}, shutting down`);
  server.close(async (err) => {
    if (err) {
      console.error('[collaboration-service] error closing HTTP server', err);
      process.exit(1);
    }

    if (activeRedisClients) {
      await Promise.allSettled([
        activeRedisClients.pubClient.quit(),
        activeRedisClients.subClient.quit(),
      ]);
    }

    if (rabbitContext) {
      await closeRabbitMQ(rabbitContext);
    }

    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

bootstrap();

function unauthorized(socket) {
  socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  socket.destroy();
}

function badRequest(socket) {
  socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
  socket.destroy();
}

server.on('upgrade', (request, socket, head) => {
  const { headers } = request;
  const host = headers.host ? `http://${headers.host}` : 'http://localhost';
  let url;

  try {
    url = new URL(request.url, host);
  } catch (error) {
    badRequest(socket);
    return;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length < 2 || segments[0] !== 'code-sync') {
    badRequest(socket);
    return;
  }

  const sessionId = segments[1];
  let token = url.searchParams.get('token');

  if (!token) {
    token = extractTokenFromCookie(request.headers?.cookie);
  }

  if (!token) {
    unauthorized(socket);
    return;
  }

  let user;
  try {
    user = resolveUserFromToken(token, env.jwtSecret);
  } catch (error) {
    unauthorized(socket);
    return;
  }

  ensureDocument(sessionId, activeMessageBus);

  request.sessionId = sessionId;
  request.user = user;
  request.url = `/${sessionId}`;

  editorWsServer.handleUpgrade(request, socket, head, (ws) => {
    ws.user = request.user;
    ws.sessionId = sessionId;
    editorWsServer.emit('connection', ws, request);
  });
});

editorWsServer.on('connection', (ws, request) => {
  setupWSConnection(ws, request, { docName: request.sessionId });
});
