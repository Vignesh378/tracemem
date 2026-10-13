import path from "path";
import {runCorePipeline } from "../clients/core.client.js";
import AnalysisJob from "../models/AnalysisJob.js";
import AppError from "../utils/AppError.js";
class AnalysisService {
  async createAndRunJob({ jobId, query, modelFiles, datasetFile, userId = null }) {
    if (!query) throw new AppError("Query is required", 400);
    if (!datasetFile) throw new AppError("Dataset file is required", 400);
    if (!modelFiles || modelFiles.length === 0) {
      throw new AppError("Model file(s) required", 400);
    }

    const modelPath = path.dirname(modelFiles[0].path);
    const datasetPath = datasetFile.path;

    const job = await AnalysisJob.create({
      _id: undefined,
      userId,
      query,
      status: "running",
      modelPath,
      datasetPath
    });

    try {
      const result = await runCorePipeline({
        modelPath,
        datasetPath,
        query
      });

      job.status = "completed";
      job.result = result;
      await job.save();

      return job;
    } catch (error) {
      job.status = "failed";
      job.error = error.message;
      await job.save();
      throw new AppError(error.message, 500);
    }
  }

  async getJob(jobId) {
    const job = await AnalysisJob.findById(jobId);
    if (!job) throw new AppError("Job not found", 404);
    return job;
  }
}

export default new AnalysisService();