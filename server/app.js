import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import matakuliahRoutes from "./routes/matakuliah.js";
import mahasiswaRoutes from "./routes/mahasiswa.js";
import exportRoutes from "./routes/export.js";

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/matakuliah", matakuliahRoutes);
app.use("/api/matakuliah", exportRoutes);
app.use("/api/mahasiswa", mahasiswaRoutes);

/** Menyalurkan permintaan API non-matching ke handler JSON 404 agar kontrak REST jelas. */
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

export default app;
