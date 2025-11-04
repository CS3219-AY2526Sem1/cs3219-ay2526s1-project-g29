import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

import { env } from './utils/env.js';
import sessionRoutes from './routes/session-routes.js';
import { attachWebsocket } from './middleware/ws-server.js';
import aiRoutes from './routes/ai-routes.js';

const app = express();

app.use(express.json());

// JSON parse error handler
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// CORS
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  })
);
app.options('*', cors());

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'collaboration-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes (internal only)
app.use('/', sessionRoutes);
app.use('/ai', aiRoutes);

// HTTP server + WS attach
const server = createServer(app);
attachWebsocket(server);

server.listen(env.port, () => {
  console.log(
    `[collaboration-service] running on http://localhost:${env.port} (${env.nodeEnv})`
  );
});

// Graceful shutdown (optional, minimal)
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
