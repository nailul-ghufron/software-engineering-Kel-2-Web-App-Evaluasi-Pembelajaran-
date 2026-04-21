# Web App Evaluasi Pembelajaran

Aplikasi web untuk dosen mengelola mata kuliah, input nilai tugas/UTS/UAS, menghitung nilai akhir dan huruf, serta mengekspor laporan ke Excel.

## Stack

| Lapisan | Teknologi |

|---------|-----------|

| Frontend | React 18, Vite 5, React Router 6, Axios |

| Backend | Node.js 20+, Express 4, ES modules |

| Database | SQLite 3 lewat `better-sqlite3` |

| Auth | JWT `jsonwebtoken`), bcrypt |

| Excel | ExcelJS 4 |

## Struktur repositori

```

├── client/                 # SPA React + Vite

│   ├── src/

│   │   ├── pages/          # Login, Dashboard, Form MK, Input Nilai, Hasil

│   │   ├── components/     # Sidebar, NilaiTable, ExportButton

│   │   └── services/api.js # Pemanggilan API + JWT

│   └── vite.config.js      # Proxy /api → backend

├── server/                 # REST API Express

│   ├── server.js

│   ├── db.js

│   ├── middleware/auth.js

│   ├── routes/             # auth, matakuliah, mahasiswa, nilai, export

│   └── services/           # kalkulasi.js, export.js (Excel)

└── docs/                   # Dokumen desain (opsional)

```

Database file default: `server/data/evaluasi_pembelajaran.db` (dibuat otomatis).

## Prasyarat

- Node.js **20 LTS** atau lebih baru

- npm (disertai Node)

## Setup lokal

### 1. Variabel lingkungan backend

Salin `server/.env.example` menjadi `server/.env` dan sesuaikan:

| Variabel | Contoh | Keterangan |

|----------|--------|------------|

| `PORT` | `3000` | Port API |

| `JWT_SECRET` | string panjang acak | Kunci penandatanganan JWT |

| `DB_PATH` | `./data/evaluasi_pembelajaran.db` | Path file SQLite (relatif ke folder `server/` atau absolut) |

| `CORS_ORIGIN` | `http://localhost:5173,...` | Daftar origin yang diizinkan browser, dipisah koma (opsional) |

Tanpa `.env`, server memakai default `PORT=3000`, `JWT_SECRET` pengembangan **hanya untuk dev**).

### 2. Instal dependensi

```bash

cd server && npm install

cd ../client && npm install

```

### 3. Menjalankan pengembangan

Terminal 1 (API):

```bash

cd server

npm run dev

```

Terminal 2 (Vite, proxy `/api` ke `http://localhost:3000`):

```bash

cd client

npm run dev

```

Buka browser: `http://localhost:5173`

Login seed default:

- **Username:** `dosen`

- **Password:** `password123`

### 4. Build produksi (frontend)

```bash

cd client

npm run build

```

Output statis ada di `client/dist/`.

## Ringkasan API

Semua endpoint kecuali `POST /api/auth/login` membutuhkan header:

`Authorization: Bearer <JWT>`

| Metode | Path | Fungsi |

|--------|------|--------|

| POST | `/api/auth/login` | Body: `{ username, password }` → `{ token, user }` |

| GET | `/api/matakuliah` | Daftar MK milik user login |

| POST | `/api/matakuliah` | Buat MK (bobot desimal, jumlah `jumlah_tugas`) |

| PUT | `/api/matakuliah/:id` | Update MK |

| DELETE | `/api/matakuliah/:id` | Hapus MK (gagal jika sudah ada data `nilai`) |

| GET | `/api/matakuliah/:id/mahasiswa` | Daftar mahasiswa |

| POST | `/api/matakuliah/:id/mahasiswa` | Tambah mahasiswa `{ nim, nama }` |

| DELETE | `/api/mahasiswa/:id` | Hapus mahasiswa + nilai (cascade) |

| GET | `/api/matakuliah/:id/nilai` | Gabungan mahasiswa + nilai untuk UI |

| POST | `/api/matakuliah/:id/nilai` | Simpan batch `{ items: [...] }` |

| POST | `/api/matakuliah/:id/hitung` | Hitung rata tugas, nilai akhir, huruf |

| GET | `/api/matakuliah/:id/export` | Unduh `.xlsx` |

Contoh login:

```bash

curl -s -X POST [http://localhost:3000/api/auth/login](http://localhost:3000/api/auth/login) \

  -H "Content-Type: application/json" \

  -d "{\"username\":\"dosen\",\"password\":\"password123\"}"

```

## Deployment

### Pola yang disarankan

- **Frontend:** hosting statis (Vercel, Netlify, GitHub Pages, CDN).

- **Backend:** mesin **tunggal** atau VPS/container dengan sistem file persisten untuk SQLite (Render, [Fly.io](http://Fly.io), Railway, VM). SQLite **tidak cocok** untuk banyak instance serverless yang menulis ke satu file secara bersamaan.

### Vercel — frontend (Vite SPA)

1. Root proyek → impor repo di Vercel; set **Root Directory** ke `client`.

2. **Build command:** `npm run build`

3. **Output directory:** `dist`

4. Tambahkan Environment variable `VITE_API_URL` jika API tidak diproxy (lihat poin CORS).

5. Tambahkan file `client/vercel.json` agar rute SPA tidak 404:

```json

{

  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]

}

```

Jika API di domain lain: di build production set `VITE_API_URL` ke **basis URL API termasuk prefix `/api`**, contoh: `https://api.domain-anda.com/api`. Tanpa variabel ini, klien memakai `/api` (cocok dengan proxy Vite saat `npm run dev`).

Backend di Vercel: untuk Express + SQLite **persisten**, umumnya membutuhkan arsitektur khusus (misalnya backend terpisah di non-serverless). Alternatif: jadikan backend satu layanan Node di Render/Railway dengan variabel `PORT` dan volume disk untuk `DB_PATH`.

### GitHub Pages — frontend statis

1. `client/vite.config.js`: set `base` ke nama repo jika dihost di subpath, misalnya `base: '/nama-repo/'`.

2. Build: `npm run build` di dalam `client/`.

3. Deploy isi folder `client/dist` (misalnya Actions dengan `peaceiris/actions-gh-pages`).

GitHub Pages **hanya** melayani file statis; API harus berjalan di **host terpisah**. Setelah deploy, arahkan frontend ke URL API (environment + axios `baseURL`).

### CORS backend

`server/server.js` mengizinkan asal `http://localhost:5173`. Untuk produksi, tambahkan origin frontend ke daftar `cors` (atau variabel env berisi daftar origin yang diizinkan).

## Pengujian singkat alur API

Setelah `npm run dev` di `server`, gunakan JWT dari login untuk memanggil endpoint terlindungi; uji ekspor Excel dengan klien HTTP yang menyimpan body biner ke file `.xlsx`.

## Lisensi / akademik

Proyek ini ditujukan untuk keperluan pengembangan dan dokumentasi mata kuliah rekayasa perangkat lunak.

