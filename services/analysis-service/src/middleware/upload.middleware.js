import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { getUploadDirs } from "../storage/local.storage.js";
import path from  "path";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.jobId) req.jobId = uuidv4();
    const { modelDir, datasetDir } = getUploadDirs(req.jobId);

    if (file.fieldname === "model") cb(null, modelDir);
    else if (file.fieldname === "dataset") cb(null, datasetDir);
    else cb(new Error("Invalid field"), null);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: (process.env.MAX_FILE_SIZE_MB || 1024) * 1024 * 1024
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
export default upload;