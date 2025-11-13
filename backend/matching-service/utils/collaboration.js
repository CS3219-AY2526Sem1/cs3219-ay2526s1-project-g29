// Send match info to collaboration-service

// Normalize base URLs (strip trailing slashes and accidental /api suffixes)
function stripTrailingSlashes(url) {
  return String(url || '').replace(/\/+$/, '');
}
function withoutApiSuffix(url) {
  return String(url || '').replace(/\/api\/?$/i, '');
}

const BASE_URL_RAW = process.env.COLLAB_SERVICE_URL || 'http://collaboration-service:8001';
const QUESTION_SERVICE_URL_RAW = process.env.QUESTION_SERVICE_URL || 'http://question-service:8003';

const BASE_URL = stripTrailingSlashes(withoutApiSuffix(BASE_URL_RAW)); // collab routes are at root (/matches)
const QUESTION_SERVICE_BASE = stripTrailingSlashes(withoutApiSuffix(QUESTION_SERVICE_URL_RAW)); // ensure no /api suffix
const INTERNAL_TOKEN = process.env.COLLAB_INTERNAL_TOKEN || 'dev-internal-token';

export async function fetchRandomQuestion(difficulty, topics = []) {
  try {
    const params = new URLSearchParams({
      difficulty: String(difficulty).toLowerCase()
    });
    if (Array.isArray(topics) && topics.length > 0) {
      params.append('topics', topics.join(','));
    }

    // Always compose with a single /api/questions prefix
    let url = `${QUESTION_SERVICE_BASE}/api/questions/random?${params.toString()}`;
    console.log('[matching-service] Fetching question from:', url, '(env:', QUESTION_SERVICE_URL_RAW, '→ base:', QUESTION_SERVICE_BASE, ')');

    let res = await fetch(url);

    // Fallback: try difficulty only
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[matching-service] random with topics failed: ${res.status} ${text}`);
      url = `${QUESTION_SERVICE_BASE}/api/questions/random?difficulty=${encodeURIComponent(String(difficulty).toLowerCase())}`;
      console.log('[matching-service] Fallback fetch (no topics):', url);
      res = await fetch(url);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[matching-service] Failed to fetch question: ${res.status} ${text}`);
      return null;
    }

    const data = await res.json();
    return data?.data || null;
  } catch (err) {
    console.error('[matching-service] Error fetching question:', err?.message || err);
    return null;
  }
}

export async function notifyCollabMatch({ sessionId, users, matchedTopics, difficulty }) {
  try {
    const question = await fetchRandomQuestion(difficulty, matchedTopics);
    if (!question) {
      console.warn('[matching-service] No question found for the match after fallback');
      return { ok: false, question: null };
    }

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
        question: {
          id: question._id || question.id,
          title: question.title,
          description: question.description,
          difficulty: question.difficulty,
          topics: question.topics,
          constraints: question.constraints,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[matching-service] failed to create collab session', res.status, text);
      return { ok: false, question, error: { status: res.status, body: text } };
    }
    return { ok: true, question };
  } catch (err) {
    console.warn('[matching-service] error calling collaboration-service', err?.message || err);
    return { ok: false, question: null, error: { message: err?.message || String(err) } };
  }
}
