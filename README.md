# Web App Evaluasi Pembelajaran

Aplikasi LMS evaluasi untuk dosen: mengelola mata kuliah, mahasiswa, input nilai, hitung nilai akhir, melihat dashboard analitik evaluasi, dan ekspor laporan Excel.

## Fitur Utama

- Login JWT dan proteksi endpoint API.
- Navigasi LMS: brand sidebar klik ke beranda dan tombol logout global.
- Dashboard evaluasi data-driven:
  - KPI jumlah mata kuliah, jumlah mahasiswa, rata-rata nilai akhir.
  - Distribusi nilai huruf (A, B+, B, C+, C, D, E).
  - Ringkasan status evaluasi per mata kuliah dan daftar MK berisiko.
- Input nilai batch dengan validasi rentang `0–100`.
- Hitung nilai akhir otomatis berbasis bobot tugas/UTS/UAS.
- Ekspor hasil evaluasi ke file `.xlsx`.

## Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Axios |
| Backend | Node.js 20+, Express 4, ES Modules |
| Database | SQLite 3 via `better-sqlite3` |
| Auth | `jsonwebtoken`, `bcrypt` |
| Export | `exceljs` |

## Struktur Folder

```text
.
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/api.js
│   ├── vite.config.js
│   ├── .env.example
│   └── vercel.json
├── server/
│   ├── server.js
│   ├── db.js
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── .env.example
└── README.md
```

Default database: `server/data/evaluasi_pembelajaran.db`.

## Environment Variables

### Backend (`server/.env`)

| Key | Contoh | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port backend |
| `JWT_SECRET` | `super-secret-key` | Secret JWT |
| `DB_PATH` | `./data/evaluasi_pembelajaran.db` | Lokasi file SQLite |
| `CORS_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173` | Origin frontend yang diizinkan |

### Frontend (`client/.env`)

| Key | Contoh | Keterangan |
|---|---|---|
| `VITE_API_URL` | `https://api.domain-anda.com/api` | Base URL API production (opsional saat dev) |

## Menjalankan Lokal

1. Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

2. Jalankan backend:

```bash
cd server
npm run dev
```

3. Jalankan frontend:

```bash
cd client
npm run dev
```

4. Buka `http://localhost:5173`

Login default seed:

- Username: `dosen`
- Password: `password123`

## Ringkasan Endpoint API

Semua endpoint selain login membutuhkan header:
`Authorization: Bearer <token>`

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/login` | Login dosen |
| GET | `/api/matakuliah` | List mata kuliah user |
| GET | `/api/matakuliah/dashboard/summary` | Data analitik dashboard evaluasi |
| POST | `/api/matakuliah` | Tambah mata kuliah |
| PUT | `/api/matakuliah/:id` | Edit mata kuliah |
| DELETE | `/api/matakuliah/:id` | Hapus mata kuliah (ditolak bila ada nilai) |
| GET | `/api/matakuliah/:id/mahasiswa` | List mahasiswa per MK |
| POST | `/api/matakuliah/:id/mahasiswa` | Tambah mahasiswa |
| DELETE | `/api/mahasiswa/:id` | Hapus mahasiswa + nilai cascade |
| GET | `/api/matakuliah/:id/nilai` | Ambil data nilai untuk input/hasil |
| POST | `/api/matakuliah/:id/nilai` | Simpan nilai batch |
| POST | `/api/matakuliah/:id/hitung` | Hitung semua nilai akhir |
| GET | `/api/matakuliah/:id/export` | Ekspor Excel |

## Build Production

Frontend build:

```bash
cd client
npm run build
```

Output: `client/dist`

## Deployment

### Rekomendasi Arsitektur

- Frontend: static hosting (Vercel, Netlify, GitHub Pages).
- Backend: Node service dengan persistent disk (Render/Railway/Fly/VM).
- SQLite tidak cocok untuk banyak instance serverless write-heavy.

### Deploy Frontend ke Vercel

1. Import repo ke Vercel.
2. Set Root Directory: `client`.
3. Build command: `npm run build`.
4. Output: `dist`.
5. Set env `VITE_API_URL` jika API dipisah domain.

`client/vercel.json` sudah disiapkan agar SPA route tidak 404.

### Deploy Frontend ke GitHub Pages

1. Set `base` pada `vite.config.js` jika deploy di subpath repo.
2. Build `client`.
3. Publish `client/dist` via GitHub Actions.
4. Pastikan `VITE_API_URL` mengarah ke backend publik.

### Deploy Backend

- Jalankan service Node dari folder `server`.
- Pastikan env `PORT`, `JWT_SECRET`, `DB_PATH`, `CORS_ORIGIN` terpasang.
- Gunakan persistent storage untuk file SQLite.

## Catatan Operasional

- Jika endpoint baru belum terdeteksi saat dev, restart proses backend `npm run dev`.
- Untuk environment production, wajib ganti `JWT_SECRET`.
- Pantau ukuran DB dan backup berkala file SQLite.

