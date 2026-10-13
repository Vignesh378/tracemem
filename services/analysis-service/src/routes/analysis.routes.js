import express from "express";
const router = express.Router();
import upload from "../middleware/upload.middleware.js";
import { runAnalysis, getAnalysis } from "../controllers/analysis.controller.js";

router.post(
  "/run",
  upload.fields([
    { name: "model", maxCount: 20 },
    { name: "dataset", maxCount: 1 }
  ]),
  runAnalysis
);

router.get("/:id", getAnalysis);
export default router;