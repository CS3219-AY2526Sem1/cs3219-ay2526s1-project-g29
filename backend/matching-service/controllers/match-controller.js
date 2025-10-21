import { getChannel, MATCH_REQUEST_QUEUE } from "../utils/rabbitmq.js";
import { validateMatchRequest, getSessionData } from "../models/match-model.js";
import { cancelMatchRequest } from "../services/match-processor.js";
import { notifyUser } from "../middleware/ws-server.js";

export async function requestMatch(req, res) {
  const { userId, topics, difficulty, questionStats } = req.body;
  
  // Validate request
  const validation = validateMatchRequest({ userId, topics, difficulty, questionStats });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  try {
    const channel = getChannel();
    
    // Normalize topics (trim and lowercase)
    const normalizedTopics = topics.map(t => t.trim().toLowerCase());
    
    // Prepare match request
    const matchRequest = {
      userId,
      topics: normalizedTopics,
      difficulty: difficulty.toLowerCase(),
      questionStats: questionStats || { easy: 0, medium: 0, hard: 0 },
      timestamp: Date.now(),
    };
    
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