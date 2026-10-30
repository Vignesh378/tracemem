import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { getUploadDirs } from "../storage/local.storage.js";
import path from "path";
import fs from "fs";

const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 512);
if (!Number.isSafeInteger(maxFileSizeMb) || maxFileSizeMb < 1) {
  throw new Error("MAX_FILE_SIZE_MB must be a positive whole number");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.jobId) req.jobId = uuidv4();
    const { modelDir, datasetDir } = getUploadDirs(req.jobId);

    if (file.fieldname === "model") cb(null, modelDir);
    else if (file.fieldname === "dataset") cb(null, datasetDir);
    else cb(new Error("Invalid field"), null);
  },
  filename: (req, file, cb) => {
    const originalName = path.basename(file.originalname)
      .replace(/[<>:"|?*\u0000-\u001f]/g, "_");
    const name = originalName || uuidv4();
    const names = req.uploadFileNames || (req.uploadFileNames = new Set());
    const key = `${file.fieldname}:${name}`;
    if (names.has(key)) {
      const extension = path.extname(name);
      const stem = path.basename(name, extension);
      const uniqueName = `${stem}-${uuidv4()}${extension}`;
      names.add(`${file.fieldname}:${uniqueName}`);
      return cb(null, uniqueName);
    }
    names.add(key);
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024,
    files: 21,
    fields: 1,
    parts: 22
  },
  fileFilter: (req, file, cb) => {
    // basic allow-list
    const ok =
      file.fieldname === "dataset" ||
      file.fieldname === "model";

    if (!ok) return cb(new Error("Invalid upload field"));
    cb(null, true);
  }
});

const parseAnalysisFiles = upload.fields([
  { name: "model", maxCount: 20 },
  { name: "dataset", maxCount: 1 }
]);

export const uploadAnalysisFiles = (req, res, next) => {
  parseAnalysisFiles(req, res, async (error) => {
    if (!error) {
      next();
      return;
    }

    if (req.jobId) {
      try {
        const { modelDir, datasetDir } = getUploadDirs(req.jobId);
        await Promise.all(
          [modelDir, datasetDir].map((dir) =>
            fs.promises.rm(dir, { recursive: true, force: true })
          )
        );
      } catch (cleanupError) {
        console.error("Failed to clean rejected upload:", cleanupError.message);
      }
    }

    next(error);
  });
};