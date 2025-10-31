import { getChannel, MATCH_REQUEST_QUEUE } from "../utils/rabbitmq.js";
import { validateMatchRequest, getSessionData } from "../models/match-model.js";
import { cancelMatchRequest, confirmMatch } from "../services/match-processor.js";
import { notifyUser } from "../middleware/ws-server.js";

export async function requestMatch(req, res) {
  const { userId, topics, difficulty } = req.body;
  
  // Validate basic request (questionStats will be fetched)
  const validation = validateMatchRequest({ userId, topics, difficulty });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  try {
    // Fetch user profile from user service
    const userServiceUrl = process.env.USER_SERVICE_URL || "http://user-service:8004";
    console.log(`Fetching user profile from: ${userServiceUrl}/users/internal/users/${userId}`);
    
    const userResponse = await fetch(`${userServiceUrl}/users/internal/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.COLLAB_INTERNAL_TOKEN}`,
        'X-Internal-Service': 'matching-service'
      }
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error(`Failed to fetch user profile. Status: ${userResponse.status}, Response: ${errorText}`);
      return res.status(400).json({ error: "Failed to fetch user profile" });
    }
    
    const userData = await userResponse.json();
    console.log(`Fetched user data:`, {
      userId: userData.data?.id || userData.id,
      questionStats: userData.data?.questionStats || userData.questionStats
    });
    
    const channel = getChannel();
    
    // Normalize topics (trim and lowercase)
    const normalizedTopics = topics.map(t => t.trim().toLowerCase());
    
    // Extract questionStats from the correct location in response
    const questionStats = userData.data?.questionStats || userData.questionStats || { easy: 0, medium: 0, hard: 0 };
    
    // Prepare match request with fetched questionStats
    const matchRequest = {
      userId,
      topics: normalizedTopics,
      difficulty: difficulty.toLowerCase(),
      questionStats,
      timestamp: Date.now(),
    };
    
    console.log(`Sending match request with questionStats:`, questionStats);
    
    // Send to RabbitMQ queue
    channel.sendToQueue(
      MATCH_REQUEST_QUEUE,
      Buffer.from(JSON.stringify(matchRequest)),
      { persistent: true }
    );
    
    console.log(`Match request queued for user ${userId}`);
    
    return res.json({
      message: "Match request queued",
      userId,
      topics: normalizedTopics,
      difficulty: matchRequest.difficulty,
    });
  } catch (error) {
    console.error("Error requesting match:", error);
    return res.status(500).json({ error: "Failed to queue match request" });
  }
}

export async function cancelMatch(req, res) {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  
  try {
    const removed = cancelMatchRequest(userId);
    
    if (removed) {
      notifyUser(userId, { type: "CANCELLED" });
      return res.json({ cancelled: true, message: "Match request cancelled" });
    }
    
    return res.status(404).json({ cancelled: false, message: "No pending match request found" });
  } catch (error) {
    console.error("Error cancelling match:", error);
    return res.status(500).json({ error: "Failed to cancel match request" });
  }
}

export async function getSession(req, res) {
  const sessionId = req.params.id;
  const session = getSessionData(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  
  return res.json(session);
}

export async function confirmMatchHandler(req, res) {
  const { userId, sessionId, accepted } = req.body;
  
  if (!userId || !sessionId || typeof accepted !== 'boolean') {
    return res.status(400).json({ 
      error: "userId, sessionId, and accepted (boolean) are required" 
    });
  }
  
  try {
    const result = confirmMatch(userId, sessionId, accepted);
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    return res.json({
      message: "Match confirmation processed",
      status: result.status,
      accepted
    });
    
  } catch (error) {
    console.error("Error confirming match:", error);
    return res.status(500).json({ error: "Failed to process match confirmation" });
  }
}