# Web App Evaluasi Pembelajaran

Aplikasi LMS evaluasi untuk dosen: mengelola mata kuliah, mahasiswa, input nilai, hitung nilai akhir, melihat dashboard analitik evaluasi, dan ekspor laporan Excel.

Demo production:

- Frontend: `https://evaluasi-pembelajaran-client.vercel.app`
- Fullstack app (frontend + API): `https://evaluasi-pembelajaran-app.vercel.app`

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
- Layout responsif mobile (sidebar berubah jadi top nav horizontal, spacing dan kontrol tabel dioptimalkan untuk layar kecil).

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
├── api/
│   └── index.js
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/api.js
│   ├── vite.config.js
│   ├── .env.example
│   └── vercel.json
├── server/
│   ├── app.js
│   ├── server.js
│   ├── db.js
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── .env.example
├── vercel.json
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

Catatan: pada build production, jika `VITE_API_URL` masih menunjuk `localhost`, frontend otomatis fallback ke `/api` agar tidak terkena CORS.

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

### Opsi 1: Fullstack dalam 1 Project Vercel (direkomendasikan untuk repo ini)

Konfigurasi root sudah tersedia:

- `vercel.json` me-rewrite `/api/*` ke `api/index.js`.
- `api/index.js` menjalankan Express app dari `server/app.js`.
- `buildCommand` root membangun frontend `client/dist`.

Deploy:

```bash
npx vercel deploy --prod
```

### Opsi 2: Frontend-only Project (`client`)

Project `client` punya `client/vercel.json` yang:

- menangani SPA fallback ke `index.html`
- mem-proxy `/api/*` ke domain backend `evaluasi-pembelajaran-app`

Deploy:

```bash
cd client
npx vercel deploy --prod
```

### Catatan SQLite di Serverless

- Untuk runtime Vercel serverless, DB akan berjalan di path sementara (`/tmp`).
- Data tidak cocok untuk write-heavy/persistensi jangka panjang.
- Untuk produksi serius, pertimbangkan migrasi ke database managed (Postgres/MySQL).

## Catatan Operasional

- Jika endpoint baru belum terdeteksi saat dev, restart proses backend `npm run dev`.
- Untuk environment production, wajib ganti `JWT_SECRET`.
- Pantau ukuran DB dan backup berkala file SQLite.

