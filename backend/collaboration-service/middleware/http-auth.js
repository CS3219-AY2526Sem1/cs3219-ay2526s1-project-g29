import jwt from 'jsonwebtoken';
import { env } from '../utils/env.js';

function extractTokenFromCookie(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => c.split('='))
    .filter(([name]) => name === 'accessToken')
    .map(([, value]) => value)
    .shift() ?? null;
}

export function requireAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    const cookieHeader = req.headers?.cookie;
    if (cookieHeader) token = extractTokenFromCookie(cookieHeader);
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication failed' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.id,
      username: payload.username ?? payload.email ?? 'anonymous',
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

