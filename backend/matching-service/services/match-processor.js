import { getChannel, MATCH_REQUEST_QUEUE } from "../utils/rabbitmq.js";
import { 
  calculateSkillScore, 
  calculateSkillDifference, 
  createSession,
  hasCommonTopic,
  getCommonTopics
} from "../models/match-model.js";
import { notifyUser } from "../middleware/ws-server.js";
import { notifyCollabMatch } from "../utils/collaboration.js";

// In-memory pending matches organized by difficulty only
// Key: difficulty (e.g., "easy", "medium", "hard")
// Value: array of { userId, topics, difficulty, questionStats, timestamp }
const pendingMatches = new Map();

// Timeout tracking
const timeoutTrackers = new Map(); // userId -> timeoutId

// Enhanced configuration
const MATCH_TIMEOUT_MS = Number(process.env.MATCHING_TIMEOUT) || 120000; // 2 minutes total
const SKILL_RELAXATION_TIME = Number(process.env.SKILL_RELAXATION_TIME) || 60000; // 1 minute skill decay
const INITIAL_SKILL_THRESHOLD = Number(process.env.INITIAL_SKILL_THRESHOLD) || 10; // Initial max skill diff
const MAX_SKILL_THRESHOLD = Number(process.env.MAX_SKILL_THRESHOLD) || 300; // Maximum threshold
const MATCH_CHECK_INTERVAL = 5000; // Check for matches every 5 seconds

export async function startMatchProcessor() {
  const channel = getChannel();
  
  console.log("Starting enhanced match processor with skill-based delays...");
  console.log(`- Total timeout: ${MATCH_TIMEOUT_MS}ms`);
  console.log(`- Skill relaxation time: ${SKILL_RELAXATION_TIME}ms`);
  console.log(`- Initial skill threshold: ${INITIAL_SKILL_THRESHOLD}`);
  
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
  
  // Start periodic match checking for delayed matches
  startPeriodicMatching();
  
  console.log("Enhanced match processor listening for requests");
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
  
  // Try immediate matching first
  const match = findBestMatch(queue, { userId, topics, userSkillScore, questionStats }, 0);
  
  if (match.found) {
    // Immediate match found
    await executeMatch(queue, match, { userId, topics, questionStats }, difficultyKey, difficulty);
  } else {
    // No immediate match, add to queue for delayed matching
    queue.push({ 
      userId, 
      topics, 
      difficulty, 
      questionStats, 
      timestamp,
      skillScore: userSkillScore,
      joinedAt: Date.now() // Track when user joined queue
    });
    
    console.log(`User ${userId} added to queue for difficulty:${difficultyKey}, topics:[${topics.join(", ")}]. Queue size: ${queue.length}`);
    console.log(`User skill score: ${userSkillScore}, will use relaxed matching over time`);
    
    // Set total timeout (2 minutes)
    setMatchTimeout(userId, difficultyKey);
  }
}

// Enhanced matching function with time-based skill threshold
function findBestMatch(queue, currentUser, timeInQueue = 0) {
  const { userId, topics, userSkillScore } = currentUser;
  
  // Calculate current skill threshold based on time in queue
  const skillThreshold = calculateSkillThreshold(timeInQueue);
  
  let bestMatchIdx = -1;
  let bestSkillDiff = Infinity;
  let bestCommonTopics = [];
  let matchQuality = 'none';
  
  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];
    
    // Skip if same user
    if (candidate.userId === userId) continue;
    
    // Check if there's at least one common topic (MANDATORY)
    if (!hasCommonTopic(topics, candidate.topics)) {
      continue;
    }
    
    // Calculate skill difference
    const skillDiff = calculateSkillDifference(userSkillScore, candidate.skillScore);
    
    // Check if within current skill threshold
    if (skillDiff <= skillThreshold && skillDiff < bestSkillDiff) {
      bestSkillDiff = skillDiff;
      bestMatchIdx = i;
      bestCommonTopics = getCommonTopics(topics, candidate.topics);
      
      // Determine match quality
      if (skillDiff <= INITIAL_SKILL_THRESHOLD * 0.3) {
        matchQuality = 'excellent';
      } else if (skillDiff <= INITIAL_SKILL_THRESHOLD * 0.7) {
        matchQuality = 'good';
      } else {
        matchQuality = 'acceptable';
      }
    }
  }
  
  return {
    found: bestMatchIdx >= 0,
    matchIdx: bestMatchIdx,
    skillDiff: bestSkillDiff,
    commonTopics: bestCommonTopics,
    quality: matchQuality,
    threshold: skillThreshold
  };
}

// Calculate skill threshold that decays linearly over time
function calculateSkillThreshold(timeInQueue) {
  if (timeInQueue >= SKILL_RELAXATION_TIME) {
    // After 1 minute, fully relaxed but capped at 300
    return Number.MAX_SAFE_INTEGER;
  }
  
  // Linear decay from INITIAL_SKILL_THRESHOLD to MAX_SKILL_THRESHOLD over SKILL_RELAXATION_TIME
  const decayProgress = timeInQueue / SKILL_RELAXATION_TIME;
  const threshold = INITIAL_SKILL_THRESHOLD + (MAX_SKILL_THRESHOLD - INITIAL_SKILL_THRESHOLD) * decayProgress;
  
  return Math.round(threshold);
}

// Execute a match between two users
async function executeMatch(queue, match, currentUser, difficultyKey, difficulty) {
  const { matchIdx, skillDiff, commonTopics, quality } = match;
  const { userId, topics, questionStats } = currentUser;
  
  // Remove matched user from queue
  const partner = queue.splice(matchIdx, 1)[0];
  
  // Clear timeouts for both users
  clearMatchTimeout(userId);
  clearMatchTimeout(partner.userId);
  
  // Create session
  const session = createSession(
    { userId, topics, questionStats },
    { userId: partner.userId, topics: partner.topics, questionStats: partner.questionStats },
    commonTopics,
    difficulty
  );
  
  console.log(`🎯 MATCH FOUND! Quality: ${quality.toUpperCase()}`);
  console.log(`   Session: ${session.sessionId}`);
  console.log(`   Users: ${userId} ↔ ${partner.userId}`);
  console.log(`   Skill difference: ${skillDiff}`);
  console.log(`   Common topics: ${commonTopics.join(", ")}`);
  console.log(`   Queue size after match: ${queue.length}`);
  
  // Notify collaboration service
  await notifyCollabMatch({
    sessionId: session.sessionId,
    users: [userId, partner.userId],
    matchedTopics: commonTopics,
    difficulty,
  });
  
  // Notify both users
  notifyUser(userId, {
    type: "MATCHED",
    sessionId: session.sessionId,
    partnerId: partner.userId,
    matchedTopics: commonTopics,
    difficulty,
    matchQuality: quality,
    skillDifference: skillDiff
  });
  
  notifyUser(partner.userId, {
    type: "MATCHED",
    sessionId: session.sessionId,
    partnerId: userId,
    matchedTopics: commonTopics,
    difficulty,
    matchQuality: quality,
    skillDifference: skillDiff
  });
}

// Periodic matching for delayed matches
function startPeriodicMatching() {
  setInterval(async () => { // Add async here
    const now = Date.now();
    
    // Check all difficulty queues for delayed matches
    for (const [difficultyKey, queue] of pendingMatches.entries()) {
      if (queue.length < 2) continue; // Need at least 2 users
      
      // Try to match users that have been waiting
      for (let i = 0; i < queue.length; i++) {
        const user = queue[i];
        const timeInQueue = now - user.joinedAt;
        
        // Skip if user just joined (give immediate matches priority)
        if (timeInQueue < 2000) continue;
        
        const match = findBestMatch(
          queue.filter((_, idx) => idx !== i), // Exclude current user
          {
            userId: user.userId,
            topics: user.topics,
            userSkillScore: user.skillScore,
            questionStats: user.questionStats
          },
          timeInQueue
        );
        
        if (match.found) {
          // Adjust match index since we filtered out current user
          const actualMatchIdx = match.matchIdx >= i ? match.matchIdx + 1 : match.matchIdx;
          
          console.log(`⏰ Delayed match triggered for user ${user.userId} after ${Math.round(timeInQueue/1000)}s`);
          console.log(`   Skill threshold was: ${match.threshold} (skill diff: ${match.skillDiff})`);
          
          // Remove current user from queue first
          queue.splice(i, 1);
          
          // Adjust match index after removal
          const finalMatchIdx = actualMatchIdx > i ? actualMatchIdx - 1 : actualMatchIdx;
          
          // Execute the match
          await executeMatch(
            queue, 
            { ...match, matchIdx: finalMatchIdx }, 
            user, 
            difficultyKey, 
            user.difficulty
          );
          
          break; // Exit loop since queue was modified
        }
      }
    }
  }, MATCH_CHECK_INTERVAL);
}

function setMatchTimeout(userId, difficultyKey) {
  // Clear existing timeout if any
  clearMatchTimeout(userId);
  
  const timeoutId = setTimeout(() => {
    console.log(`⏱️  Match timeout for user ${userId} after ${MATCH_TIMEOUT_MS/1000}s`);
    
    // Remove from queue
    const queue = pendingMatches.get(difficultyKey);
    if (queue) {
      const idx = queue.findIndex((req) => req.userId === userId);
      if (idx >= 0) {
        const user = queue.splice(idx, 1)[0];
        const timeInQueue = Date.now() - user.joinedAt;
        console.log(`   User was in queue for ${Math.round(timeInQueue/1000)}s`);
      }
    }
    
    // Notify user of timeout
    notifyUser(userId, {
      type: "MATCH_TIMEOUT",
      message: "No suitable match found within 2 minutes. Please try again.",
      timeWaited: MATCH_TIMEOUT_MS
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
      const user = queue.splice(idx, 1)[0];
      const timeInQueue = Date.now() - user.joinedAt;
      removed = true;
      console.log(`❌ Cancelled: Removed user ${userId} from difficulty:${difficultyKey} queue after ${Math.round(timeInQueue/1000)}s`);
      break;
    }
  }
  
  return removed;
}
