import express from "express";
import { uploadAnalysisFiles } from "../middleware/upload.middleware.js";
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
  uploadAnalysisFiles,
  runAnalysis
);

// dynamic route last
router.get("/:id", getAnalysis);

export default router;