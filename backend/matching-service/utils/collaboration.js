// Send match info to collaboration-service

const BASE_URL = process.env.COLLAB_SERVICE_URL || 'http://localhost:8001';
const INTERNAL_TOKEN = process.env.COLLAB_INTERNAL_TOKEN || 'dev-internal-token';
const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'http://localhost:8003';

export async function fetchRandomQuestion(difficulty, topics = []) {
  try {
    const params = new URLSearchParams({
      difficulty: difficulty.toLowerCase(),
    });

    if (topics && topics.length > 0) {
      params.append('topics', topics.join(','));
    }

    const url = `${QUESTION_SERVICE_URL}/questions/random?${params}`;
    console.log('[matching-service] Fetching question from:', url);

    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`[matching-service] Failed to fetch question: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('[matching-service] Error fetching question:', err?.message || err);
    return null;
  }
}

export async function notifyCollabMatch({ sessionId, users, matchedTopics, difficulty }) {
  try {
    const question = await fetchRandomQuestion(difficulty, matchedTopics);
    if (!question) {
      console.warn('[matching-service] No question found for the match');
      return false;
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
        question: question ? {
          id: question._id,
          title: question.title,
          description: question.description,
          difficulty: question.difficulty,
          topics: question.topics,
          examples: question.examples || [],
        } : null,
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
