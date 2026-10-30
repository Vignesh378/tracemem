import express from "express";
import rateLimit from "express-rate-limit";
const router = express.Router();

import { register, login, logout, profile } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Try again later." }
});

router.get("/health", (req, res) => {
  res.status(200).json({ success: true, service: "auth-service", status: "ok" });
});

// public routes
router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.post("/logout", logout);

// protected routes
router.get("/profile", protect, profile);

export default router;