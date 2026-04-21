import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validasiBobot } from "../services/kalkulasi.js";
import { listNilaiHandler, saveNilaiBatchHandler, hitungSemuaHandler } from "./nilai.js";

const router = Router();

router.use(requireAuth);

function getMk(userId, id) {
  return db.prepare("SELECT * FROM mata_kuliah WHERE id = ? AND pengguna_id = ?").get(id, userId);
}

/** Menyajikan daftar mata kuliah beserta jumlah mahasiswa untuk dashboard dosen. */
router.get("/", (req, res) => {
  const userId = req.user.sub;
  const rows = db
    .prepare(
      `SELECT mk.id, mk.kode_mk, mk.nama_mk,
              mk.bobot_tugas, mk.bobot_uts, mk.bobot_uas, mk.jumlah_tugas,
              (SELECT COUNT(*) FROM mahasiswa m WHERE m.mata_kuliah_id = mk.id) AS jumlah_mahasiswa
       FROM mata_kuliah mk
       WHERE mk.pengguna_id = ?
       ORDER BY mk.kode_mk`
    )
    .all(userId);
  return res.json(rows);
});

/** Mencatat definisi bobot dan metadata MK baru setelah bobot tervalidasi ke 100%. */
router.post("/", (req, res) => {
  const userId = req.user.sub;
  const {
    kode_mk,
    nama_mk,
    bobot_tugas,
    bobot_uts,
    bobot_uas,
    jumlah_tugas,
  } = req.body || {};
  if (!kode_mk || !nama_mk || bobot_tugas == null || bobot_uts == null || bobot_uas == null) {
    return res.status(400).json({ error: "Data mata kuliah tidak lengkap" });
  }
  const jt = Number(jumlah_tugas);
  if (!Number.isInteger(jt) || jt < 1) {
    return res.status(400).json({ error: "Jumlah tugas harus bilangan bulat positif" });
  }
  try {
    validasiBobot(bobot_tugas, bobot_uts, bobot_uas);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  try {
    const info = db
      .prepare(
        `INSERT INTO mata_kuliah (kode_mk, nama_mk, bobot_tugas, bobot_uts, bobot_uas, jumlah_tugas, pengguna_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(kode_mk, nama_mk, bobot_tugas, bobot_uts, bobot_uas, jt, userId);
    const row = db.prepare("SELECT * FROM mata_kuliah WHERE id = ?").get(info.lastInsertRowid);
    return res.status(201).json(row);
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      return res.status(409).json({ error: "Kode mata kuliah sudah digunakan" });
    }
    return res.status(500).json({ error: "Gagal menyimpan mata kuliah" });
  }
});

/** Memperbarui definisi MK hanya jika masih dimiliki pengguna yang sama. */
router.put("/:id", (req, res) => {
  const userId = req.user.sub;
  const id = Number(req.params.id);
  const existing = getMk(userId, id);
  if (!existing) {
    return res.status(404).json({ error: "Mata kuliah tidak ditemukan" });
  }
  const {
    kode_mk,
    nama_mk,
    bobot_tugas,
    bobot_uts,
    bobot_uas,
    jumlah_tugas,
  } = req.body || {};
  if (!kode_mk || !nama_mk || bobot_tugas == null || bobot_uts == null || bobot_uas == null) {
    return res.status(400).json({ error: "Data mata kuliah tidak lengkap" });
  }
  const jt = Number(jumlah_tugas);
  if (!Number.isInteger(jt) || jt < 1) {
    return res.status(400).json({ error: "Jumlah tugas harus bilangan bulat positif" });
  }
  try {
    validasiBobot(bobot_tugas, bobot_uts, bobot_uas);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  try {
    db.prepare(
      `UPDATE mata_kuliah SET kode_mk = ?, nama_mk = ?, bobot_tugas = ?, bobot_uts = ?, bobot_uas = ?, jumlah_tugas = ?
       WHERE id = ? AND pengguna_id = ?`
    ).run(kode_mk, nama_mk, bobot_tugas, bobot_uts, bobot_uas, jt, id, userId);
    const row = db.prepare("SELECT * FROM mata_kuliah WHERE id = ?").get(id);
    return res.json(row);
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      return res.status(409).json({ error: "Kode mata kuliah sudah digunakan" });
    }
    return res.status(500).json({ error: "Gagal memperbarui mata kuliah" });
  }
});

/** Menolak penghapusan MK bila sudah ada rekaman nilai pada mahasiswa di MK tersebut. */
router.delete("/:id", (req, res) => {
  const userId = req.user.sub;
  const id = Number(req.params.id);
  const existing = getMk(userId, id);
  if (!existing) {
    return res.status(404).json({ error: "Mata kuliah tidak ditemukan" });
  }
  const block = db
    .prepare(
      `SELECT 1 FROM nilai n
       JOIN mahasiswa m ON m.id = n.mahasiswa_id
       WHERE m.mata_kuliah_id = ?
       LIMIT 1`
    )
    .get(id);
  if (block) {
    return res.status(400).json({ error: "Tidak dapat menghapus mata kuliah yang masih memiliki data nilai" });
  }
  db.prepare("DELETE FROM mata_kuliah WHERE id = ? AND pengguna_id = ?").run(id, userId);
  return res.status(204).send();
});

/** Mengembalikan daftar mahasiswa terdaftar pada MK untuk form input NIM/nama. */
router.get("/:id/mahasiswa", (req, res) => {
  const userId = req.user.sub;
  const mkId = Number(req.params.id);
  const mk = getMk(userId, mkId);
  if (!mk) {
    return res.status(404).json({ error: "Mata kuliah tidak ditemukan" });
  }
  const rows = db
    .prepare(
      `SELECT id, nim, nama FROM mahasiswa WHERE mata_kuliah_id = ? ORDER BY nim`
    )
    .all(mkId);
  return res.json(rows);
});

/** Menambahkan mahasiswa dengan guard NIM unik dalam satu MK. */
router.post("/:id/mahasiswa", (req, res) => {
  const userId = req.user.sub;
  const mkId = Number(req.params.id);
  const mk = getMk(userId, mkId);
  if (!mk) {
    return res.status(404).json({ error: "Mata kuliah tidak ditemukan" });
  }
  const { nim, nama } = req.body || {};
  if (!nim || !nama) {
    return res.status(400).json({ error: "NIM dan nama wajib diisi" });
  }
  try {
    const info = db
      .prepare(`INSERT INTO mahasiswa (nim, nama, mata_kuliah_id) VALUES (?, ?, ?)`)
      .run(nim, nama, mkId);
    const row = db.prepare(`SELECT id, nim, nama FROM mahasiswa WHERE id = ?`).get(info.lastInsertRowid);
    return res.status(201).json(row);
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      return res.status(409).json({ error: "NIM sudah terdaftar pada mata kuliah ini" });
    }
    return res.status(500).json({ error: "Gagal menambah mahasiswa" });
  }
});

router.get("/:id/nilai", listNilaiHandler);
router.post("/:id/nilai", saveNilaiBatchHandler);
router.post("/:id/hitung", hitungSemuaHandler);

export default router;
