import { Router } from "express";
import { explainCode, getStatus } from "../controllers/ai-controller.js";

const router = Router();

router.get("/status", getStatus);
router.post("/explain", explainCode);

export default router;