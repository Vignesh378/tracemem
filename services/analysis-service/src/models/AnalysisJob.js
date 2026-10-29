import mongoose from "mongoose";

const analysisJobSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
      default: null
    },
    query: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued"
    },

    // local temp paths (short-lived)
    modelPath: { type: String, default: null },
    datasetPath: { type: String, default: null },

    // S3 keys (permanent storage references)
    modelKeys: { type: [String], default: [] },
    datasetKey: { type: String, default: null },

    result: { type: Object, default: null },
    error: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("AnalysisJob", analysisJobSchema);