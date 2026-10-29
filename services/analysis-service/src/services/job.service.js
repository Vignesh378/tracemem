import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import AnalysisJob from "../models/AnalysisJob.js";
import { runCorePipeline } from "../clients/core.client.js";
import {
  deleteFileFromS3,
  uploadFileToS3
} from "../storage/s3.storage.js";
import AppError from "../utils/AppError.js";

const STORAGE_MODE = process.env.STORAGE_MODE || "local";
const TEMP_DIR = process.env.TEMP_DIR || "./tmp";
const MAX_EXAMPLES = Number(process.env.MAX_EXAMPLES || 30);

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function removeDir(dir) {
  await fs.promises.rm(dir, { recursive: true, force: true });
}

class JobService {
  async createJob({ userId = null, query, modelFiles, datasetFile }) {
    if (!query) throw new AppError("Query is required", 400);
    if (!modelFiles?.length) throw new AppError("Model file is required", 400);
    if (!datasetFile) throw new AppError("Dataset file is required", 400);

    const jobId = uuidv4();
    const tempJobDir = path.resolve(TEMP_DIR, jobId);
    const tempModelDir = path.join(tempJobDir, "model");
    const tempDatasetDir = path.join(tempJobDir, "dataset");
    const uploadedDirs = new Set([
      ...modelFiles.map((file) => path.dirname(file.path)),
      path.dirname(datasetFile.path)
    ]);
    const modelKeys = [];
    let datasetKey = null;

    try {
      await ensureDir(tempModelDir);
      await ensureDir(tempDatasetDir);

      const stagedModelPaths = await Promise.all(
        modelFiles.map(async (file) => {
          const fileName = path.basename(file.path);
          const stagedPath = path.join(tempModelDir, fileName);
          await fs.promises.copyFile(file.path, stagedPath);
          return { fileName, stagedPath };
        })
      );
      const datasetFileName = path.basename(datasetFile.path);
      const stagedDatasetPath = path.join(tempDatasetDir, datasetFileName);
      await fs.promises.copyFile(datasetFile.path, stagedDatasetPath);

      if (STORAGE_MODE === "s3") {
        for (const { fileName, stagedPath } of stagedModelPaths) {
          const key = `jobs/${jobId}/model/${fileName}`;
          await uploadFileToS3(stagedPath, key);
          modelKeys.push(key);
        }
        datasetKey = `jobs/${jobId}/dataset/${datasetFileName}`;
        await uploadFileToS3(stagedDatasetPath, datasetKey);
      } else if (STORAGE_MODE !== "local") {
        throw new Error(`Unsupported STORAGE_MODE: ${STORAGE_MODE}`);
      }

      for (const dir of uploadedDirs) await removeDir(dir);

      const job = await AnalysisJob.create({
        userId,
        query,
        status: "queued",
        modelPath: tempModelDir,
        datasetPath: stagedDatasetPath,
        modelKeys,
        datasetKey,
        result: null,
        error: null
      });

      this.processJob(job._id.toString(), tempJobDir).catch((err) => {
        console.error("Background job failed:", err.message);
      });

      return job;
    } catch (err) {
      await removeDir(tempJobDir).catch((cleanupError) => {
        console.error("Failed to clean temporary job files:", cleanupError.message);
      });
      for (const key of [...modelKeys, datasetKey].filter(Boolean)) {
        await deleteFileFromS3(key).catch((cleanupError) => {
          console.error(`Failed to clean S3 object ${key}:`, cleanupError.message);
        });
      }
      for (const dir of uploadedDirs) {
        await removeDir(dir).catch((cleanupError) => {
          console.error("Failed to clean uploaded files:", cleanupError.message);
        });
      }
      throw err;
    }
  }

  async processJob(jobId, tempJobDir) {
    let job;
    try {
      job = await AnalysisJob.findById(jobId);
      if (!job) throw new Error(`Analysis job ${jobId} was not found`);

      job.status = "running";
      await job.save();

      const result = await runCorePipeline({
        modelPath: job.modelPath,
        datasetPath: job.datasetPath,
        query: job.query,
        maxExamples: MAX_EXAMPLES
      });

      job.status = "completed";
      job.result = result;
      job.error = null;
      await job.save();
    } catch (err) {
      if (job) {
        job.status = "failed";
        job.error = err.message || "Analysis failed";
        await job.save();
      }
      throw err;
    } finally {
      await removeDir(tempJobDir);
    }
  }

  async getJobById(jobId) {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError("Invalid job id", 400);
  }

  const job = await AnalysisJob.findById(jobId);
  if (!job) throw new AppError("Job not found", 404);
  return job;
}
}

export default new JobService();