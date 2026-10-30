import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const clientUrl =
  process.env.CLIENT_URL || (isProduction ? false : "http://localhost:5173");

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export default app;