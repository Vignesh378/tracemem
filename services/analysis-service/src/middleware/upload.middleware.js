import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { getUploadDirs } from "../storage/local.storage.js";
import path from "path";
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