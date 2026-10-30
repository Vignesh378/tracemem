import "dotenv/config";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5002;

async function start() {
  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL must be configured in production");
  }

  const storageMode = process.env.STORAGE_MODE || "local";
  if (!["local", "s3"].includes(storageMode)) {
    throw new Error(`Unsupported STORAGE_MODE: ${storageMode}`);
  }
  if (storageMode === "s3") {
    if (!process.env.AWS_REGION || !process.env.S3_BUCKET) {
      throw new Error("AWS_REGION and S3_BUCKET must be configured for S3 storage");
    }
    if (Boolean(process.env.AWS_ACCESS_KEY_ID) !== Boolean(process.env.AWS_SECRET_ACCESS_KEY)) {
      throw new Error("AWS access key ID and secret access key must be configured together");
    }
  }

  await connectDB();
  const { default: app } = await import("./app.js");
  app.listen(PORT, () => {
    console.log(`Analysis service running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error(
    "Analysis service startup failed:",
    process.env.NODE_ENV === "production" ? "Check service configuration" : error.message
  );
  process.exitCode = 1;
});