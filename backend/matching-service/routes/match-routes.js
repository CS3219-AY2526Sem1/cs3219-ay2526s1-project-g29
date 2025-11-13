import express from "express";
import { requestMatch, cancelMatch, getSession, confirmMatchHandler } from "../controllers/match-controller.js";

const router = express.Router();

router.post("/match", requestMatch);
router.post("/cancel", cancelMatch);
router.post("/confirm", confirmMatchHandler);
router.get("/session/:id", getSession);

export default router;