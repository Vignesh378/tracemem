import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "auth-service", status: "ok" });
});

app.use("/api/auth", authRoutes);
export default app;