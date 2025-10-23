// Send match info to collaboration-service

const BASE_URL = process.env.COLLAB_SERVICE_URL || 'http://localhost:8001';
const INTERNAL_TOKEN = process.env.COLLAB_INTERNAL_TOKEN || 'dev-internal-token';

export async function notifyCollabMatch({ sessionId, users, matchedTopics, difficulty }) {
  try {
    const res = await fetch(`${BASE_URL}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        sessionId,
        users: users.map((id) => ({ id })),
        matchedTopics,
        difficulty,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[matching-service] failed to create collab session', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[matching-service] error calling collaboration-service', err?.message || err);
    return false;
  }
}
