import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** Menghapus mahasiswa dan baris nilainya memanfaatkan cascade FK di skema SQLite. */
router.delete("/:id", requireAuth, (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const row = db
    .prepare(
      `SELECT m.id FROM mahasiswa m
       JOIN mata_kuliah mk ON mk.id = m.mata_kuliah_id
       WHERE m.id = ? AND mk.pengguna_id = ?`
    )
    .get(id, userId);
  if (!row) {
    return res.status(404).json({ error: "Mahasiswa tidak ditemukan" });
  }
  db.prepare("DELETE FROM mahasiswa WHERE id = ?").run(id);
  return res.status(204).send();
});

export default router;
