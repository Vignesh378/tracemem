import "dotenv/config";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5001;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured");
  }
  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL must be configured in production");
  }

  const { default: app } = await import("./app.js");
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error(
    "Auth service startup failed:",
    process.env.NODE_ENV === "production" ? "Check service configuration" : error.message
  );
  process.exitCode = 1;
});