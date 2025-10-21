import express from 'express';
import cors from 'cors';

import { env } from './utils/env.js';

const app = express();

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'collaboration-service',
    timestamp: new Date().toISOString(),
  });
});

export { app };
