// Skill level scoring (used as secondary matching criterion)
export function calculateSkillScore(questionStats) {
  if (!questionStats) return 0;
  const { easy = 0, medium = 0, hard = 0 } = questionStats;
  // Weight: easy=1, medium=3, hard=5
  return easy * 1 + medium * 3 + hard * 5;
}

export function calculateSkillDifference(score1, score2) {
  return Math.abs(score1 - score2);
}

// Check if two topic arrays have at least one common topic
export function hasCommonTopic(topics1, topics2) {
  if (!Array.isArray(topics1) || !Array.isArray(topics2)) return false;
  const set1 = new Set(topics1.map(t => t.toLowerCase()));
  return topics2.some(t => set1.has(t.toLowerCase()));
}

// Get all common topics between two arrays
export function getCommonTopics(topics1, topics2) {
  if (!Array.isArray(topics1) || !Array.isArray(topics2)) return [];
  const set1 = new Set(topics1.map(t => t.toLowerCase()));
  return topics2.filter(t => set1.has(t.toLowerCase())).map(t => t.toLowerCase());
}

// Match request structure validation (updated for multiple topics)
export function validateMatchRequest(data) {
  const { userId, topics, difficulty, questionStats } = data;
  
  if (!userId || typeof userId !== "string") {
    return { valid: false, error: "userId is required and must be a string" };
  }
  
  // Topics must be a non-empty array of strings
  if (!Array.isArray(topics) || topics.length === 0) {
    return { valid: false, error: "topics is required and must be a non-empty array of strings" };
  }
  
  if (!topics.every(t => typeof t === "string" && t.trim().length > 0)) {
    return { valid: false, error: "all topics must be non-empty strings" };
  }
  
  const validDifficulties = ["easy", "medium", "hard"];
  if (!difficulty || !validDifficulties.includes(difficulty.toLowerCase())) {
    return { valid: false, error: "difficulty must be one of: easy, medium, hard" };
  }
  
  return { valid: true };
}

// Session storage
export const activeSessions = new Map(); // sessionId -> { users, topics, matchedTopics, difficulty, createdAt }
export let sessionIdCounter = 1;

export function createSession(user1, user2, matchedTopics, difficulty) {
  const sessionId = `session-${Date.now()}-${sessionIdCounter++}`;
  const session = {
    sessionId,
    users: [user1.userId, user2.userId],
    topics: {
      user1: user1.topics,
      user2: user2.topics,
    },
    matchedTopics,
    difficulty,
    createdAt: new Date().toISOString(),
  };
  activeSessions.set(sessionId, session);
  return session;
}

export function getSessionData(sessionId) {
  return activeSessions.get(sessionId);
}