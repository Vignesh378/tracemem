import express from "express";
import upload from "../middleware/upload.middleware.js";
import {
  runAnalysis,
  getAnalysis
} from "../controllers/analysis.controller.js";

const router = express.Router();

// static routes first
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "analysis-service",
    status: "ok"
  });
});

router.post(
  "/run",
  upload.fields([
    { name: "model", maxCount: 20 },
    { name: "dataset", maxCount: 1 }
  ]),
  runAnalysis
);

// dynamic route last
router.get("/:id", getAnalysis);

export default router;