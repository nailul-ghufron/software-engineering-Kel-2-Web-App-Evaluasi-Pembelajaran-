import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH
  ? path.isAbsolute(process.env.DB_PATH)
    ? process.env.DB_PATH
    : path.resolve(__dirname, process.env.DB_PATH)
  : process.env.VERCEL
    ? "/tmp/evaluasi_pembelajaran.db"
  : path.join(__dirname, "data", "evaluasi_pembelajaran.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS pengguna (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama_lengkap TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mata_kuliah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_mk TEXT UNIQUE NOT NULL,
  nama_mk TEXT NOT NULL,
  bobot_tugas REAL NOT NULL,
  bobot_uts REAL NOT NULL,
  bobot_uas REAL NOT NULL,
  jumlah_tugas INTEGER NOT NULL,
  pengguna_id INTEGER REFERENCES pengguna(id)
);

CREATE TABLE IF NOT EXISTS mahasiswa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nim TEXT NOT NULL,
  nama TEXT NOT NULL,
  mata_kuliah_id INTEGER NOT NULL REFERENCES mata_kuliah(id) ON DELETE CASCADE,
  UNIQUE (mata_kuliah_id, nim)
);

CREATE TABLE IF NOT EXISTS nilai (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mahasiswa_id INTEGER UNIQUE NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  nilai_tugas_json TEXT,
  nilai_uts REAL,
  nilai_uas REAL,
  rata_rata_tugas REAL,
  nilai_akhir REAL,
  nilai_huruf TEXT
);
`;

db.exec(SCHEMA);

/** Memastikan user demo ada untuk pengembangan lokal tanpa langkah seed manual. */
function seedDefaultUser() {
  const existing = db.prepare("SELECT id FROM pengguna WHERE username = ?").get("dosen");
  if (existing) return;
  const hash = bcrypt.hashSync("password123", 10);
  db.prepare(
    "INSERT INTO pengguna (username, password_hash, nama_lengkap) VALUES (?, ?, ?)"
  ).run("dosen", hash, "Dosen Default");
}

seedDefaultUser();

export default db;
