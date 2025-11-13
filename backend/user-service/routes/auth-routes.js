import express from "express";

import {
  handleLogin,
  handleVerifyToken,
  handleLogout,
} from "../controller/auth-controller.js";
import { verifyAccessToken } from "../middleware/basic-access-control.js";

const router = express.Router();

router.post("/login", handleLogin);
router.post("/logout", handleLogout);

router.get("/verify-token", verifyAccessToken, handleVerifyToken);

export default router;
