## 👤 1. (Rafi) : ARSITEKTUR

**TUGAS:** Membuat **1 (SATU) DIAGRAM** saja (Diagram Arsitektur 3-Layer: Atas, Tengah, Bawah).

### \[KOTAK LAYER 1 (PALING ATAS): Presentation Layer\]

- **Label Teknologi:** React 18 + Vite (SPA)
- **Lokasi:** Browser Dosen
- **Isi Blok (Sub-kotak):**
  - Komponen 1: Halaman Dashboard
  - Komponen 2: Halaman Manajemen Mata Kuliah
  - Komponen 3: Halaman Input Nilai
  - Komponen 4: Halaman Hasil Evaluasi

**↓ \[PANAH KOMUNIKASI: Layer 1 ke Layer 2\] ↓**

- **Label Panah:** HTTP/HTTPS (REST API)
- **Format:** JSON
- **Port:** 3000
- **Contoh Request:** POST /api/matakuliah, POST /api/nilai/hitung

### \[KOTAK LAYER 2 (TENGAH): Business Logic Layer\]

- **Label Teknologi:** Node.js 20 LTS + Express.js
- **Lokasi:** Server Backend
- **Isi Blok (Sub-kotak):**
  - Modul 1: Auth Middleware (JWT)
  - Modul 2: Route Handler Mata Kuliah
  - Modul 3: Route Handler Mahasiswa
  - Modul 4: Kalkulasi Nilai (Core Engine)
  - Modul 5: Export Service (ExcelJS)

**↓ \[PANAH KOMUNIKASI: Layer 2 ke Layer 3\] ↓**

- **Label Panah:** better-sqlite3 (API Sinkron)
- **Format:** SQL Query Langsung
- **Contoh Query:** SELECT \* FROM nilai

### \[KOTAK LAYER 3 (PALING BAWAH): Data Layer\]

- **Label Teknologi:** SQLite 3
- **Lokasi:** 1 File .db Lokal di Server
- **Isi Blok (Tabel):**
  - Tabel: pengguna
  - Tabel: mata_kuliah
  - Tabel: mahasiswa
  - Tabel: nilai

## 👤 2: KOMPONEN (Yusuf)

**TUGAS:** Membuat **1 (SATU) DIAGRAM** saja (Component Diagram dengan kotak dan colokan/port antarmuka).

### \[KOTAK KOMPONEN 1: UI Component (React SPA)\]

- **Isi:** DashboardPage, MataKuliahForm, NilaiInputTable, HasilEvaluasiTable, ExportButton
- **Interface Disediakan (Provided):** UI Interaksi Dosen
- **Panah Keluar (Required):** Terhubung ke API Service

### \[KOTAK KOMPONEN 2: API Service (Axios/Fetch)\]

- **Interface Disediakan (Provided):** getMataKuliah(), saveMataKuliah(), hitungNilai(), exportExcel()
- **Panah Keluar (Required):** Terhubung ke Express Router

### \[KOTAK KOMPONEN 3: Express Router (API Routes)\]

- **Interface Disediakan (Provided):** Endpoint /api/auth/login, /api/matakuliah, /api/nilai/hitung
- **Panah Keluar (Required):** Terhubung ke Auth Service, Kalkulasi Service, Export Service

### \[KOTAK KOMPONEN 4: Auth Service\]

- **Isi/Dependensi:** jsonwebtoken, bcrypt
- **Interface Disediakan:** login(user,pass), verifyToken(token), hashPassword(plain)

### \[KOTAK KOMPONEN 5: Kalkulasi Service (Core Engine)\]

- **Interface Disediakan:** hitungRataRataTugas(), hitungNilaiAkhir(), capNilai(max 100), konversiHuruf(A-E)
- **Panah Keluar (Required):** Terhubung ke DB Repository

### \[KOTAK KOMPONEN 6: Export Service (ExcelJS)\]

- **Interface Disediakan:** generateExcel(data) -> Buffer, setHeader(res, filename)
- **Format Header:** 11 Kolom (NIM, Nama, Tugas, UTS, UAS, Nilai Akhir, dll)

### \[KOTAK KOMPONEN 7: DB Repository (better-sqlite3)\]

- **Interface Disediakan:** findMataKuliah(id), saveNilai(data), getNilaiLengkap(mkId)
- **Panah Keluar (Required):** Terhubung langsung ke File SQLite (.db)

## 👤 3: DEPLOYMENT (Fajar)

**TUGAS:** Membuat **1 (SATU) DIAGRAM** saja (Deployment Diagram berbentuk kubus 3D/node infrastruktur).

### \[NODE 1: Client Node (Perangkat Dosen)\]

- **Jenis:** PC / Laptop (Min: Dual-core, RAM 4GB)
- **Artefak di dalam Node:** \* Browser (Chrome/Firefox/Edge)
  - React SPA Bundle (HTML+JS+CSS)

**↔ \[GARIS KONEKSI NODE 1 KE NODE 2\] ↔**

- **Label Garis:** Network (HTTP/1.1 atau HTTP/2)
- **Format Data:** JSON (Request API), Binary Stream (.xlsx)
- **Keamanan:** HTTPS SSL/TLS, CORS Enabled

### \[NODE 2: Application Server Node\]

- **Jenis:** Server Linux (Ubuntu 22.04+) / Windows Server
- **Artefak di dalam Node:**
  - Node.js Runtime (v20 LTS)
  - Aplikasi Express (index.js, routes/, controllers/)
  - React Build (folder dist/ static files)
  - node_modules (express, better-sqlite3, bcrypt, dll)

### \[NODE 3: Storage Node (Dalam Server yg Sama dgn Node 2)\]

- **Jenis:** File System Lokal Server
- **Artefak di dalam Node:**
  - File: evaluasi.db (Berisi 4 tabel)
- **Konfigurasi:** pragma journal_mode = WAL

## 👤 4: DATA & ERD (IRFAN)

**TUGAS:** Membuat **2 (DUA) DIAGRAM** (Diagram ERD Database dan Diagram Aliran Data/Data Flow).

### DIAGRAM 1: ERD (Entity Relationship Diagram) (IRFAN)

- **Entitas pengguna**
  - id (PK, INTEGER)
  - username (TEXT, UNIQUE, NOT NULL)
  - password_hash (TEXT, NOT NULL)
  - nama_lengkap (TEXT, NOT NULL)
  - _Relasi:_ 1 pengguna memiliki N mata_kuliah (1..\*)
- **Entitas mata_kuliah**
  - id (PK, INTEGER)
  - kode_mk (TEXT, UNIQUE, NOT NULL)
  - nama_mk (TEXT, NOT NULL)
  - bobot_tugas, bobot_uts, bobot_uas (REAL, NOT NULL)
  - jumlah_tugas (INTEGER, NOT NULL)
  - pengguna_id (FK)
  - _Relasi:_ 1 mata_kuliah memiliki N mahasiswa (1..\*)
- **Entitas mahasiswa**
  - id (PK, INTEGER)
  - nim (TEXT, NOT NULL)
  - nama (TEXT, NOT NULL)
  - mata_kuliah_id (FK)
  - _Relasi:_ 1 mahasiswa memiliki 1 nilai (1..1)
- **Entitas nilai**
  - id (PK, INTEGER)
  - nilai_tugas_json (TEXT - Array JSON)
  - nilai_uts, nilai_uas (REAL)
  - rata_rata_tugas, nilai_akhir (REAL)
  - nilai_huruf (TEXT)
  - mahasiswa_id (FK UNIQUE)

### DIAGRAM 2: DATA FLOW (Aliran Data)

- **\[KOTAK INPUT\] Dari Dosen:** \* Form Konfigurasi MK (Kode, Nama, Bobot)
  - Input Mahasiswa (NIM, Nama)
  - Input Nilai (Tugas 1-N, UTS, UAS)
- **\[KOTAK PROSES\] Kalkulasi Sistem:**
  - Parse JSON Tugas -> Rata-rata: sum(tugas)/n
  - Nilai Akhir: (bobot_tugas × rata) + (bobot_uts × uts) + (bobot_uas × uas)
  - Constraint: Jika > 100 paksa jadi 100
  - Konversi: 85-100=A, 80-84=B+, dst.
- **\[KOTAK OUTPUT\] File Excel:**
  - JOIN tabel mk + mahasiswa + nilai
  - Worksheet nama = kode_mk
  - Header response: Content-Disposition: attachment

## 👤 5: UI DESIGN / WIREFRAME

**TUGAS:** Membuat **1 (SATU) SET FLOW DIAGRAM / WIREFRAME** (Terdiri dari 5 rancangan halaman dan panah navigasinya).

### \[HALAMAN 1: Login\]

- **Elemen UI:** Judul "Evaluasi Pembelajaran", Field Username, Field Password, Tombol "Masuk"
- **Behavior:** Redirect ke Dashboard jika sukses, Pesan Error Merah jika gagal.

### \[HALAMAN 2: Dashboard\]

- **Elemen UI:** Sidebar Kiri, Judul "Selamat Datang", Card Statistik (Jumlah MK), Tombol Utama "+ Tambah Mata Kuliah"
- **Tabel:** Daftar MK (Kolom: Kode, Nama, Jml Mhs, Aksi: "Kelola" & "Hapus")

### \[HALAMAN 3: Form Mata Kuliah\]

- **Elemen UI:** Input Kode MK, Nama MK, Bobot Tugas %, Bobot UTS %, Bobot UAS %, Jumlah Tugas. Tombol "Simpan" & "Batal".
- **Validasi Khusus (Penting):** Indikator Total Bobot harus 100%. Jika belum 100%, tombol "Simpan" DISABLED.

### \[HALAMAN 4: Input Nilai (Tabel Dinamis)\]

- **Elemen UI:** Header Info MK & Bobot, Tombol "+ Tambah Mahasiswa", Tombol "Hitung Semua Nilai", Tombol "Simpan Semua" (Biru Besar).
- **Bentuk Tabel:** Inline-edit. Kolom: NIM, Nama, Tugas 1..N (Dinamis sesuai setting), UTS, UAS, Aksi (Hapus). Validasi input angka 0-100.

### \[HALAMAN 5: Hasil Evaluasi & Ekspor\]

- **Elemen UI:** Judul Halaman, Tabel Read-Only. Tombol "Ekspor ke Excel" (Hijau, Kanan Atas).
- **Tabel:** NIM, Nama, Rata Tugas, %Tugas, UTS, %UTS, UAS, %UAS, Nilai Akhir, Nilai Huruf (Color coding: A=Hijau, E=Merah).
- **Behavior:** Tombol Ekspor diklik -> Loading 5 detik -> Download .xlsx.

### \[ALUR NAVIGASI UI / FLOW\]

_(Gambarkan panah berurutan antar halaman)_

Login → Dashboard ↔ Form MK → Input Nilai → Hasil Evaluasi → Download Excel