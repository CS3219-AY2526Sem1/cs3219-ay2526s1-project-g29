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

// Confirmation tracking
const pendingConfirmations = new Map(); // sessionId -> { user1: {userId, confirmed}, user2: {userId, confirmed}, timeout }
const CONFIRMATION_TIMEOUT_MS = 30000; // 30 seconds to confirm

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
  
  // Fetch usernames from user service
  const userServiceUrl = process.env.USER_SERVICE_URL || "http://user-service:8004";
  
  let user1Username = 'Anonymous';
  let user2Username = 'Anonymous';
  
  try {
    // Fetch user 1 details
    const user1Response = await fetch(`${userServiceUrl}/users/internal/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.COLLAB_INTERNAL_TOKEN}`,
        'X-Internal-Service': 'matching-service'
      }
    });
    
    if (user1Response.ok) {
      const user1Data = await user1Response.json();
      user1Username = user1Data.data?.username || user1Data.username || 'Anonymous';
    }
    
    // Fetch user 2 details
    const user2Response = await fetch(`${userServiceUrl}/users/internal/users/${partner.userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.COLLAB_INTERNAL_TOKEN}`,
        'X-Internal-Service': 'matching-service'
      }
    });
    
    if (user2Response.ok) {
      const user2Data = await user2Response.json();
      user2Username = user2Data.data?.username || user2Data.username || 'Anonymous';
    }
  } catch (error) {
    console.error('Error fetching usernames:', error);
  }
  
  // Create session
  const session = createSession(
    { userId, topics, questionStats },
    { userId: partner.userId, topics: partner.topics, questionStats: partner.questionStats },
    commonTopics,
    difficulty
  );
  
  console.log(`🎯 MATCH FOUND! Quality: ${quality.toUpperCase()}`);
  console.log(`   Session: ${session.sessionId}`);
  console.log(`   Users: ${user1Username} (${userId}) ↔ ${user2Username} (${partner.userId})`);
  console.log(`   Awaiting confirmation from both users...`);
  
  // Store pending confirmation with usernames
  pendingConfirmations.set(session.sessionId, {
    user1: { 
      userId, 
      username: user1Username,
      confirmed: false, 
      userInfo: { topics, questionStats } 
    },
    user2: { 
      userId: partner.userId,
      username: user2Username,
      confirmed: false, 
      userInfo: { topics: partner.topics, questionStats: partner.questionStats } 
    },
    matchInfo: { commonTopics, difficulty, quality, skillDiff },
    createdAt: Date.now()
  });
  
  // Set confirmation timeout
  setConfirmationTimeout(session.sessionId);
  
  // Notify both users of potential match (not final match)
  const user1Notification = {
    type: "MATCH_FOUND",
    sessionId: session.sessionId,
    partnerId: partner.userId,
    partnerUsername: user2Username,
    partnerInfo: {
      userId: partner.userId,
      username: user2Username,
    },
    matchedTopics: commonTopics,
    difficulty,
    matchQuality: quality,
    skillDifference: skillDiff,
    timeToConfirm: CONFIRMATION_TIMEOUT_MS
  };
  
  const user2Notification = {
    type: "MATCH_FOUND",
    sessionId: session.sessionId,
    partnerId: userId,
    partnerUsername: user1Username,
    partnerInfo: {
      userId: userId,
      username: user1Username,
    },
    matchedTopics: commonTopics,
    difficulty,
    matchQuality: quality,
    skillDifference: skillDiff,
    timeToConfirm: CONFIRMATION_TIMEOUT_MS
  };
  
  console.log(`Sending MATCH_FOUND to ${user1Username} (${userId})`);
  console.log(`Sending MATCH_FOUND to ${user2Username} (${partner.userId})`);
  
  // Send notifications
  notifyUser(userId, user1Notification);
  notifyUser(partner.userId, user2Notification);
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

////////// Confirmation pop up /////////////

export function confirmMatch(userId, sessionId, accepted) {
  const confirmation = pendingConfirmations.get(sessionId);
  if (!confirmation) {
    return { error: 'Match confirmation not found or expired' };
  }
  
  // Find which user is confirming
  let confirmingUser, otherUser;
  if (confirmation.user1.userId === userId) {
    confirmingUser = confirmation.user1;
    otherUser = confirmation.user2;
  } else if (confirmation.user2.userId === userId) {
    confirmingUser = confirmation.user2;
    otherUser = confirmation.user1;
  } else {
    return { error: 'User not part of this match' };
  }
  
  if (!accepted) {
    // User rejected the match
    console.log(`❌ Match rejected by user ${userId} for session ${sessionId}`);
    
    // Clear confirmation timeout
    clearConfirmationTimeout(sessionId);
    
    // Remove from pending confirmations
    pendingConfirmations.delete(sessionId);
    
    // Notify both users
    notifyUser(confirmingUser.userId, {
      type: "MATCH_REJECTED",
      message: "You rejected the match",
      sessionId
    });
    
    notifyUser(otherUser.userId, {
      type: "MATCH_REJECTED", 
      message: "Your partner rejected the match",
      sessionId
    });
    
    // Put both users back in queue with higher priority
    requeueUsers([confirmingUser, otherUser], confirmation.matchInfo.difficulty);
    
    return { success: true, status: 'rejected' };
  }
  
  // User accepted the match
  confirmingUser.confirmed = true;
  console.log(`✅ Match accepted by user ${userId} for session ${sessionId}`);
  
  // Notify the other user about this acceptance
  notifyUser(otherUser.userId, {
    type: "PARTNER_CONFIRMED",
    message: "Your partner has accepted the match",
    sessionId,
    waitingFor: "your confirmation"
  });
  
  // Check if both users have confirmed
  if (confirmation.user1.confirmed && confirmation.user2.confirmed) {
    // Both confirmed - proceed with collaboration
    console.log(`🎉 Both users confirmed! Starting collaboration session ${sessionId}`);
    
    // Clear confirmation timeout
    clearConfirmationTimeout(sessionId);
    
    // Remove from pending confirmations
    pendingConfirmations.delete(sessionId);
    
    // Create collaboration session
    finalizeBothConfirmedMatch(sessionId, confirmation);
    
    return { success: true, status: 'both_confirmed' };
  }
  
  return { success: true, status: 'waiting_for_partner' };
}

async function finalizeBothConfirmedMatch(sessionId, confirmation) {
  const { user1, user2, matchInfo } = confirmation;
  
  // Notify collaboration service
  await notifyCollabMatch({
    sessionId,
    users: [user1.userId, user2.userId],
    matchedTopics: matchInfo.commonTopics,
    difficulty: matchInfo.difficulty,
  });
  
  // Notify both users - final match confirmed
  notifyUser(user1.userId, {
    type: "MATCH_CONFIRMED",
    sessionId,
    partnerId: user2.userId,
    matchedTopics: matchInfo.commonTopics,
    difficulty: matchInfo.difficulty,
    matchQuality: matchInfo.quality,
    message: "Both users confirmed! Starting collaboration..."
  });
  
  notifyUser(user2.userId, {
    type: "MATCH_CONFIRMED",
    sessionId,
    partnerId: user1.userId, 
    matchedTopics: matchInfo.commonTopics,
    difficulty: matchInfo.difficulty,
    matchQuality: matchInfo.quality,
    message: "Both users confirmed! Starting collaboration..."
  });
}

function setConfirmationTimeout(sessionId) {
  const timeoutId = setTimeout(() => {
    console.log(`⏱️ Confirmation timeout for session ${sessionId}`);
    
    const confirmation = pendingConfirmations.get(sessionId);
    if (confirmation) {
      // Notify users about timeout
      notifyUser(confirmation.user1.userId, {
        type: "CONFIRMATION_TIMEOUT",
        message: "Match confirmation timed out",
        sessionId
      });
      
      notifyUser(confirmation.user2.userId, {
        type: "CONFIRMATION_TIMEOUT",
        message: "Match confirmation timed out", 
        sessionId
      });
      
      // Put users back in queue
      requeueUsers([confirmation.user1, confirmation.user2], confirmation.matchInfo.difficulty);
      
      // Remove from pending confirmations
      pendingConfirmations.delete(sessionId);
    }
  }, CONFIRMATION_TIMEOUT_MS);
  
  // Store timeout ID in confirmation object
  if (pendingConfirmations.has(sessionId)) {
    pendingConfirmations.get(sessionId).timeoutId = timeoutId;
  }
}

function clearConfirmationTimeout(sessionId) {
  const confirmation = pendingConfirmations.get(sessionId);
  if (confirmation && confirmation.timeoutId) {
    clearTimeout(confirmation.timeoutId);
    delete confirmation.timeoutId;
  }
}

function requeueUsers(users, difficulty) {
  // Put users back in queue with slightly higher priority
  const difficultyKey = difficulty.toLowerCase();
  const queue = pendingMatches.get(difficultyKey) || [];
  
  users.forEach(user => {
    if (user.confirmed === false) { // Only requeue if they didn't confirm
      queue.unshift({ // Add to front for priority
        userId: user.userId,
        topics: user.userInfo.topics,
        difficulty,
        questionStats: user.userInfo.questionStats,
        timestamp: Date.now(),
        skillScore: calculateSkillScore(user.userInfo.questionStats),
        joinedAt: Date.now(),
        requeued: true
      });
      
      console.log(`🔄 Requeued user ${user.userId} after match timeout/rejection`);
      
      // Set timeout for requeued user
      setMatchTimeout(user.userId, difficultyKey);
    }
  });
  
  pendingMatches.set(difficultyKey, queue);
}
