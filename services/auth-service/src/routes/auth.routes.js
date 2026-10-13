import express from "express";
const router = express.Router();

import { register, login, logout,profile} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

// public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// protected routes
router.get("/profile", protect, profile);

export default router;