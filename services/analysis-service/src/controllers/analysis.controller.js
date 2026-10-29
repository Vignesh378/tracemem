import jobService from "../services/job.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

export const runAnalysis = asyncHandler(async (req, res) => {
  const query = req.body.query;
  const modelFiles = req.files?.model || [];
  const datasetFile = req.files?.dataset?.[0];

  if (!query) throw new AppError("Query text is required", 400);
  if (!modelFiles.length) throw new AppError("Model file is required", 400);
  if (!datasetFile) throw new AppError("Dataset file is required", 400);

  const job = await jobService.createJob({
    userId: req.user?.id || req.user?._id || null,
    query,
    modelFiles,
    datasetFile
  });

  // returns immediately
  res.status(202).json({
    success: true,
    message: "Analysis job started",
    jobId: job._id,
    status: job.status
  });
});

export const getAnalysis = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(req.params.id);

  res.status(200).json({
    success: true,
    jobId: job._id,
    status: job.status,
    modelKeys: job.modelKeys,
    datasetKey: job.datasetKey,
    result: job.result,
    error: job.error
  });
});