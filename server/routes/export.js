import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { generateWorkbook, buildFilename } from "../services/export.js";

const router = Router();

/** Menghasilkan unduhan Excel berisi ringkasan nilai per mahasiswa untuk arsip MK. */
router.get("/:id/export", requireAuth, async (req, res) => {
  const userId = req.user.sub;
  const mkId = Number(req.params.id);
  const mk = db
    .prepare("SELECT * FROM mata_kuliah WHERE id = ? AND pengguna_id = ?")
    .get(mkId, userId);
  if (!mk) {
    return res.status(404).json({ error: "Mata kuliah tidak ditemukan" });
  }
  const rows = db
    .prepare(
      `SELECT m.nim, m.nama, n.rata_rata_tugas, n.nilai_uts, n.nilai_uas, n.nilai_akhir, n.nilai_huruf
       FROM mahasiswa m
       LEFT JOIN nilai n ON n.mahasiswa_id = m.id
       WHERE m.mata_kuliah_id = ?
       ORDER BY m.nim`
    )
    .all(mkId);
  const buffer = await generateWorkbook({ mataKuliah: mk, rows });
  const fname = buildFilename(mk.kode_mk);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fname}"`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  return res.send(Buffer.from(buffer));
});

export default router;
