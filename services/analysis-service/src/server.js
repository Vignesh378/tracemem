import "dotenv/config";
import connectDB from "./config/db.js";
import app from "./app.js";

connectDB();

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Analysis service running on port ${PORT}`);
  console.log("STORAGE_MODE =", process.env.STORAGE_MODE);
  console.log("S3_BUCKET =", process.env.S3_BUCKET);
});