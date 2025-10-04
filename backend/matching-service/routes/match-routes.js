import express from "express";
import { requestMatch, cancelMatch, getSession } from "../controllers/match-controller.js";

const router = express.Router();

router.post("/match", requestMatch);
router.post("/cancel", cancelMatch);
router.get("/session/:id", getSession);

export default router;