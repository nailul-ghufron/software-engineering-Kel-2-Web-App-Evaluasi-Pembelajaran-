import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../db.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

/** Mengecek kredensial pengguna lalu mengembalikan JWT bertanda subjek untuk akses API. */
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi" });
  }
  const user = db
    .prepare("SELECT id, username, password_hash, nama_lengkap FROM pengguna WHERE username = ?")
    .get(username);
  if (!user) {
    return res.status(401).json({ error: "Kredensial tidak valid" });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Kredensial tidak valid" });
  }
  const token = signToken({ sub: user.id, username: user.username });
  return res.json({
    token,
    user: { id: user.id, username: user.username, nama_lengkap: user.nama_lengkap },
  });
});

export default router;
