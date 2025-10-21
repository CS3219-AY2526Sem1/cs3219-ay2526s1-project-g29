import jwt from 'jsonwebtoken';

export function extractToken(handshake) {
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
    return extractTokenFromCookie(cookieHeader);
  }

  return null;
}

export function extractTokenFromCookie(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => cookie.split('='))
    .filter(([name]) => name === 'accessToken')
    .map(([, value]) => value)
    .shift() ?? null;
}

export function resolveUserFromToken(token, secret) {
  const payload = jwt.verify(token, secret);
  return {
    id: payload.id,
    username: payload.username ?? payload.email ?? 'anonymous',
  };
}
