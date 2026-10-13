import asyncHandler from "../utils/asyncHandler.js";
import analysisService from "../services/analysis.service.js";
import AppError from "../utils/AppError.js";

export const runAnalysis = asyncHandler(async (req, res) => {
  const query = req.body.query;
  const modelFiles = req.files?.model || [];
  const datasetFile = req.files?.dataset?.[0];

  if (!query) throw new AppError("Query text is required", 400);

  const job = await analysisService.createAndRunJob({
    jobId: req.jobId,
    query,
    modelFiles,
    datasetFile,
    userId: req.user?.id || null
  });

  res.status(200).json({
    success: true,
    message: "Analysis completed",
    jobId: job._id,
    status: job.status,
    result: job.result
  });
});

export const getAnalysis = asyncHandler(async (req, res) => {
  const job = await analysisService.getJob(req.params.id);
  res.status(200).json({
    success: true,
    job
  });
});