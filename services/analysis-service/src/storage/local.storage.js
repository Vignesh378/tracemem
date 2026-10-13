import fs from "fs";
import path from "path";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getUploadDirs = (jobId) => {
  const base = path.resolve(process.env.UPLOAD_DIR || "storage/uploads");
  const modelDir = path.join(base, "models", jobId);
  const datasetDir = path.join(base, "datasets", jobId);

  ensureDir(modelDir);
  ensureDir(datasetDir);

  return { modelDir, datasetDir };
};

export { getUploadDirs, ensureDir };