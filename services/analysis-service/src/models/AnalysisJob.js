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
    modelPath: {
      type: String
    },
    datasetPath: {
      type: String
    },
    result: {
      type: Object,
      default: null
    },
    error: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("AnalysisJob", analysisJobSchema);