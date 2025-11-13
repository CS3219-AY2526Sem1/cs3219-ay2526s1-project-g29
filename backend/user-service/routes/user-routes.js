import express from "express";

import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  getUserProfile,
  updateUser,
  updateUserPrivilege,
  addQuestionAttempted,
  getQuestionsAttempted,
} from "../controller/user-controller.js";
import { verifyAccessToken, verifyIsAdmin, verifyIsOwnerOrAdmin } from "../middleware/basic-access-control.js";

import { findUserById } from "../model/repository.js";

const router = express.Router();

// Internal endpoint for service-to-service communication
router.get('/internal/users/:id', async (req, res) => {
  try {
    // Verify internal service call using the token
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== process.env.COLLAB_INTERNAL_TOKEN) {
      return res.status(403).json({ error: 'Unauthorized internal service call' });
    }
    
    const userId = req.params.id;
    const user = await findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data in the same format as the regular endpoint
    return res.status(200).json({
      message: "Found user",
      data: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt,
        skillLevel: user.skillLevel,
        questionsCompleted: user.questionsCompleted,
        questionStats: user.questionStats
      }
    });
  } catch (error) {
    console.error('Error fetching user for internal service:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Internal endpoint to add attempted question (no cookie/JWT; internal token only)
router.post('/internal/users/:id/questions-attempted', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');
    if (token !== process.env.COLLAB_INTERNAL_TOKEN) {
      return res.status(403).json({ error: 'Unauthorized internal service call' });
    }
    // Reuse existing controller logic
    const { addQuestionAttempted } = await import('../controller/user-controller.js');
    return addQuestionAttempted(req, res);
  } catch (err) {
    console.error('Internal addQuestionAttempted error:', err);
    return res.status(500).json({ error: 'Internal error while adding attempted question' });
  }
});

router.get("/profile", verifyAccessToken, getUserProfile);

router.get("/questions-attempted", verifyAccessToken, getQuestionsAttempted);

router.get("/", verifyAccessToken, verifyIsAdmin, getAllUsers);

router.patch("/:id/privilege", verifyAccessToken, verifyIsAdmin, updateUserPrivilege);

router.post("/", createUser);

router.get("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, getUser);

router.patch("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, updateUser);

router.post(
  "/:id/questions-attempted",
  verifyAccessToken,
  verifyIsOwnerOrAdmin,
  addQuestionAttempted
);

router.delete("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, deleteUser);

export default router;
