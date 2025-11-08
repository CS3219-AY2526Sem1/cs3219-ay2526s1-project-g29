import express from 'express';
import { matchFoundHandler, getSessionHandler, leaveSessionHandler, autosaveHandler } from '../controllers/session-controller.js';
import { requireAuth } from '../middleware/http-auth.js';

const router = express.Router();

router.post('/matches', matchFoundHandler);
router.get('/sessions/:id', getSessionHandler);
router.post('/sessions/:id/leave', requireAuth, leaveSessionHandler);
router.post('/sessions/:id/autosave', requireAuth, autosaveHandler);

export default router;
