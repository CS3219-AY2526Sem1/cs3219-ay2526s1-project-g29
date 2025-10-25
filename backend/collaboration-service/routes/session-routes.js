import express from 'express';
import { matchFoundHandler, getSessionHandler, leaveSessionHandler } from '../controllers/session-controller.js';
import { requireAuth } from '../middleware/http-auth.js';

const router = express.Router();

router.post('/matches', matchFoundHandler);
router.get('/sessions/:id', getSessionHandler);
router.post('/sessions/:id/leave', requireAuth, leaveSessionHandler);

export default router;
