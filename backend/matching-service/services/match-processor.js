import { getChannel, MATCH_REQUEST_QUEUE } from "../utils/rabbitmq.js";
import { 
  calculateSkillScore, 
  calculateSkillDifference, 
  createSession,
  hasCommonTopic,
  getCommonTopics
} from "../models/match-model.js";
import { notifyUser } from "../middleware/ws-server.js";

// In-memory pending matches organized by difficulty only
// Key: difficulty (e.g., "easy", "medium", "hard")
// Value: array of { userId, topics, difficulty, questionStats, timestamp }
const pendingMatches = new Map();

// Timeout tracking
const timeoutTrackers = new Map(); // userId -> timeoutId

const MATCH_TIMEOUT_MS = Number(process.env.MATCHING_TIMEOUT) || 30000;

export async function startMatchProcessor() {
  const channel = getChannel();
  
  console.log("Starting match processor...");
  
  // Consume match requests
  await channel.consume(MATCH_REQUEST_QUEUE, async (msg) => {
    if (!msg) return;
    
    try {
      const matchRequest = JSON.parse(msg.content.toString());
      console.log("Processing match request:", matchRequest);
      
      await processMatchRequest(matchRequest);
      
      channel.ack(msg);
    } catch (error) {
      console.error("Error processing match request:", error);
      channel.nack(msg, false, false); // Don't requeue on error
    }
  });
  
  console.log("Match processor listening for requests");
}

async function processMatchRequest(request) {
  const { userId, topics, difficulty, questionStats, timestamp } = request;
  
  // Normalize difficulty for queuing
  const difficultyKey = difficulty.toLowerCase();
  
  // Get or create pending queue for this difficulty
  if (!pendingMatches.has(difficultyKey)) {
    pendingMatches.set(difficultyKey, []);
  }
  
  const queue = pendingMatches.get(difficultyKey);
  
  // Calculate skill score for this user
  const userSkillScore = calculateSkillScore(questionStats);
  
  // Try to find a match: must have common topic AND same difficulty
  let bestMatchIdx = -1;
  let bestSkillDiff = Infinity;
  let bestCommonTopics = [];
  
  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];
    
    // Skip if same user (shouldn't happen but safety check)
    if (candidate.userId === userId) continue;
    
    // Check if there's at least one common topic
    if (!hasCommonTopic(topics, candidate.topics)) {
      continue; // No common topic, skip
    }
    
    // Calculate skill difference
    const candidateSkillScore = calculateSkillScore(candidate.questionStats);
    const skillDiff = calculateSkillDifference(userSkillScore, candidateSkillScore);
    
    // Find closest skill match among users with common topics
    if (skillDiff < bestSkillDiff) {
      bestSkillDiff = skillDiff;
      bestMatchIdx = i;
      bestCommonTopics = getCommonTopics(topics, candidate.topics);
    }
  }
  
  if (bestMatchIdx >= 0) {
    // Found a match!
    const partner = queue.splice(bestMatchIdx, 1)[0];
    
    // Clear timeouts
    clearMatchTimeout(userId);
    clearMatchTimeout(partner.userId);
    
    // Create session with matched topics
    const session = createSession(
      { userId, topics, questionStats },
      { userId: partner.userId, topics: partner.topics, questionStats: partner.questionStats },
      bestCommonTopics,
      difficulty
    );
    
    console.log(`Match found! Session: ${session.sessionId}, Common topics: ${bestCommonTopics.join(", ")}`);
    
    // Notify both users
    notifyUser(userId, {
      type: "MATCHED",
      sessionId: session.sessionId,
      partnerId: partner.userId,
      matchedTopics: bestCommonTopics,
      difficulty,
    });
    
    notifyUser(partner.userId, {
      type: "MATCHED",
      sessionId: session.sessionId,
      partnerId: userId,
      matchedTopics: bestCommonTopics,
      difficulty,
    });
  } else {
    // No match found, add to queue
    queue.push({ userId, topics, difficulty, questionStats, timestamp });
    console.log(`User ${userId} added to queue for difficulty:${difficultyKey}, topics:[${topics.join(", ")}]. Queue size: ${queue.length}`);
    
    // Set timeout
    setMatchTimeout(userId, difficultyKey);
  }
}

function setMatchTimeout(userId, difficultyKey) {
  // Clear existing timeout if any
  clearMatchTimeout(userId);
  
  const timeoutId = setTimeout(() => {
    console.log(`Match timeout for user ${userId}`);
    
    // Remove from queue
    const queue = pendingMatches.get(difficultyKey);
    if (queue) {
      const idx = queue.findIndex((req) => req.userId === userId);
      if (idx >= 0) {
        queue.splice(idx, 1);
      }
    }
    
    // Notify user
    notifyUser(userId, {
      type: "MATCH_TIMEOUT",
      message: "No match found within timeout period",
    });
    
    timeoutTrackers.delete(userId);
  }, MATCH_TIMEOUT_MS);
  
  timeoutTrackers.set(userId, timeoutId);
}

function clearMatchTimeout(userId) {
  const timeoutId = timeoutTrackers.get(userId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutTrackers.delete(userId);
  }
}

export function cancelMatchRequest(userId) {
  let removed = false;
  
  // Clear timeout
  clearMatchTimeout(userId);
  
  // Search all difficulty queues
  for (const [difficultyKey, queue] of pendingMatches.entries()) {
    const idx = queue.findIndex((req) => req.userId === userId);
    if (idx >= 0) {
      queue.splice(idx, 1);
      removed = true;
      console.log(`Removed user ${userId} from difficulty:${difficultyKey} queue`);
      break;
    }
  }
  
  return removed;
}