import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysis.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ service: "analysis-service", status: "ok" });
});

app.use("/api/analysis", analysisRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export default app;