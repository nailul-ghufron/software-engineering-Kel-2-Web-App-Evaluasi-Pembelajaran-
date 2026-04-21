import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validasiBobot } from '../services/kalkulasi.js';
import {
	hitungSemuaHandler,
	listNilaiHandler,
	saveNilaiBatchHandler,
} from './nilai.js';

const router = Router();

router.use(requireAuth);

function getMk(userId, id) {
	return db
		.prepare('SELECT * FROM mata_kuliah WHERE id = ? AND pengguna_id = ?')
		.get(id, userId);
}

/** Menyajikan daftar mata kuliah beserta jumlah mahasiswa untuk dashboard dosen. */
router.get('/', (req, res) => {
	const userId = req.user.sub;
	const rows = db
		.prepare(
			`SELECT mk.id, mk.kode_mk, mk.nama_mk,
              mk.bobot_tugas, mk.bobot_uts, mk.bobot_uas, mk.jumlah_tugas,
              (SELECT COUNT(*) FROM mahasiswa m WHERE m.mata_kuliah_id = mk.id) AS jumlah_mahasiswa
       FROM mata_kuliah mk
       WHERE mk.pengguna_id = ?
       ORDER BY mk.kode_mk`,
		)
		.all(userId);
	return res.json(rows);
});

/** Menyediakan ringkasan evaluasi lintas mata kuliah untuk dashboard LMS dosen. */
router.get('/dashboard/summary', (req, res) => {
	const userId = req.user.sub;
	const base = db
		.prepare(
			`SELECT
         COUNT(DISTINCT mk.id) AS jumlah_mk,
         COUNT(DISTINCT m.id) AS jumlah_mahasiswa,
         AVG(n.nilai_akhir) AS rata_nilai_akhir,
         SUM(CASE WHEN n.nilai_huruf = 'A' THEN 1 ELSE 0 END) AS huruf_a,
         SUM(CASE WHEN n.nilai_huruf = 'B+' THEN 1 ELSE 0 END) AS huruf_bplus,
         SUM(CASE WHEN n.nilai_huruf = 'B' THEN 1 ELSE 0 END) AS huruf_b,
         SUM(CASE WHEN n.nilai_huruf = 'C+' THEN 1 ELSE 0 END) AS huruf_cplus,
         SUM(CASE WHEN n.nilai_huruf = 'C' THEN 1 ELSE 0 END) AS huruf_c,
         SUM(CASE WHEN n.nilai_huruf = 'D' THEN 1 ELSE 0 END) AS huruf_d,
         SUM(CASE WHEN n.nilai_huruf = 'E' THEN 1 ELSE 0 END) AS huruf_e
       FROM mata_kuliah mk
       LEFT JOIN mahasiswa m ON m.mata_kuliah_id = mk.id
       LEFT JOIN nilai n ON n.mahasiswa_id = m.id
       WHERE mk.pengguna_id = ?`,
		)
		.get(userId);

	const mkRows = db
		.prepare(
			`SELECT
         mk.id,
         mk.kode_mk,
         mk.nama_mk,
         COUNT(m.id) AS jumlah_mahasiswa,
         COUNT(n.id) AS jumlah_nilai,
         SUM(CASE WHEN n.nilai_akhir IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_terhitung,
         AVG(n.nilai_akhir) AS rata_nilai_akhir,
         SUM(CASE WHEN n.nilai_huruf IN ('D','E') THEN 1 ELSE 0 END) AS jumlah_rendah
       FROM mata_kuliah mk
       LEFT JOIN mahasiswa m ON m.mata_kuliah_id = mk.id
       LEFT JOIN nilai n ON n.mahasiswa_id = m.id
       WHERE mk.pengguna_id = ?
       GROUP BY mk.id
       ORDER BY mk.kode_mk`,
		)
		.all(userId);

	const ringkasanMk = mkRows.map((row) => {
		const jumlahMhs = Number(row.jumlah_mahasiswa || 0);
		const jumlahTerhitung = Number(row.jumlah_terhitung || 0);
		const progress =
			jumlahMhs > 0 ? Math.round((jumlahTerhitung / jumlahMhs) * 100) : 0;
		const status =
			jumlahMhs === 0
				? 'BELUM_ADA_MAHASISWA'
				: jumlahTerhitung === 0
					? 'BELUM_DIHITUNG'
					: jumlahTerhitung < jumlahMhs
						? 'SEBAGIAN'
						: 'SELESAI';
		return {
			id: row.id,
			kode_mk: row.kode_mk,
			nama_mk: row.nama_mk,
			jumlah_mahasiswa: jumlahMhs,
			rata_nilai_akhir:
				row.rata_nilai_akhir == null
					? null
					: Math.round(Number(row.rata_nilai_akhir) * 100) / 100,
			progress_hitung: progress,
			status_evaluasi: status,
			jumlah_rendah: Number(row.jumlah_rendah || 0),
		};
	});

	const mkBerisiko = [...ringkasanMk]
		.filter(
			(mk) =>
				mk.jumlah_rendah > 0 ||
				(mk.rata_nilai_akhir != null && mk.rata_nilai_akhir < 70),
		)
		.sort(
			(a, b) =>
				b.jumlah_rendah - a.jumlah_rendah ||
				(a.rata_nilai_akhir ?? 100) - (b.rata_nilai_akhir ?? 100),
		)
		.slice(0, 5);

	return res.json({
		kpi: {
			jumlah_mk: Number(base.jumlah_mk || 0),
			jumlah_mahasiswa: Number(base.jumlah_mahasiswa || 0),
			rata_nilai_akhir:
				base.rata_nilai_akhir == null
					? null
					: Math.round(Number(base.rata_nilai_akhir) * 100) / 100,
		},
		distribusi_huruf: {
			A: Number(base.huruf_a || 0),
			'B+': Number(base.huruf_bplus || 0),
			B: Number(base.huruf_b || 0),
			'C+': Number(base.huruf_cplus || 0),
			C: Number(base.huruf_c || 0),
			D: Number(base.huruf_d || 0),
			E: Number(base.huruf_e || 0),
		},
		ringkasan_mk: ringkasanMk,
		mk_berisiko: mkBerisiko,
	});
});

/** Mencatat definisi bobot dan metadata MK baru setelah bobot tervalidasi ke 100%. */
router.post('/', (req, res) => {
	const userId = req.user.sub;
	const { kode_mk, nama_mk, bobot_tugas, bobot_uts, bobot_uas, jumlah_tugas } =
		req.body || {};
	if (
		!kode_mk ||
		!nama_mk ||
		bobot_tugas == null ||
		bobot_uts == null ||
		bobot_uas == null
	) {
		return res.status(400).json({ error: 'Data mata kuliah tidak lengkap' });
	}
	const jt = Number(jumlah_tugas);
	if (!Number.isInteger(jt) || jt < 1) {
		return res
			.status(400)
			.json({ error: 'Jumlah tugas harus bilangan bulat positif' });
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
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
			)
			.run(kode_mk, nama_mk, bobot_tugas, bobot_uts, bobot_uas, jt, userId);
		const row = db
			.prepare('SELECT * FROM mata_kuliah WHERE id = ?')
			.get(info.lastInsertRowid);
		return res.status(201).json(row);
	} catch (e) {
		if (String(e).includes('UNIQUE')) {
			return res
				.status(409)
				.json({ error: 'Kode mata kuliah sudah digunakan' });
		}
		return res.status(500).json({ error: 'Gagal menyimpan mata kuliah' });
	}
});

/** Memperbarui definisi MK hanya jika masih dimiliki pengguna yang sama. */
router.put('/:id', (req, res) => {
	const userId = req.user.sub;
	const id = Number(req.params.id);
	const existing = getMk(userId, id);
	if (!existing) {
		return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
	}
	const { kode_mk, nama_mk, bobot_tugas, bobot_uts, bobot_uas, jumlah_tugas } =
		req.body || {};
	if (
		!kode_mk ||
		!nama_mk ||
		bobot_tugas == null ||
		bobot_uts == null ||
		bobot_uas == null
	) {
		return res.status(400).json({ error: 'Data mata kuliah tidak lengkap' });
	}
	const jt = Number(jumlah_tugas);
	if (!Number.isInteger(jt) || jt < 1) {
		return res
			.status(400)
			.json({ error: 'Jumlah tugas harus bilangan bulat positif' });
	}
	try {
		validasiBobot(bobot_tugas, bobot_uts, bobot_uas);
	} catch (e) {
		return res.status(400).json({ error: e.message });
	}
	try {
		db.prepare(
			`UPDATE mata_kuliah SET kode_mk = ?, nama_mk = ?, bobot_tugas = ?, bobot_uts = ?, bobot_uas = ?, jumlah_tugas = ?
       WHERE id = ? AND pengguna_id = ?`,
		).run(kode_mk, nama_mk, bobot_tugas, bobot_uts, bobot_uas, jt, id, userId);
		const row = db.prepare('SELECT * FROM mata_kuliah WHERE id = ?').get(id);
		return res.json(row);
	} catch (e) {
		if (String(e).includes('UNIQUE')) {
			return res
				.status(409)
				.json({ error: 'Kode mata kuliah sudah digunakan' });
		}
		return res.status(500).json({ error: 'Gagal memperbarui mata kuliah' });
	}
});

/** Menolak penghapusan MK bila sudah ada rekaman nilai pada mahasiswa di MK tersebut. */
router.delete('/:id', (req, res) => {
	const userId = req.user.sub;
	const id = Number(req.params.id);
	const existing = getMk(userId, id);
	if (!existing) {
		return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
	}
	const block = db
		.prepare(
			`SELECT 1 FROM nilai n
       JOIN mahasiswa m ON m.id = n.mahasiswa_id
       WHERE m.mata_kuliah_id = ?
       LIMIT 1`,
		)
		.get(id);
	if (block) {
		return res
			.status(400)
			.json({
				error:
					'Tidak dapat menghapus mata kuliah yang masih memiliki data nilai',
			});
	}
	db.prepare('DELETE FROM mata_kuliah WHERE id = ? AND pengguna_id = ?').run(
		id,
		userId,
	);
	return res.status(204).send();
});

/** Mengembalikan daftar mahasiswa terdaftar pada MK untuk form input NIM/nama. */
router.get('/:id/mahasiswa', (req, res) => {
	const userId = req.user.sub;
	const mkId = Number(req.params.id);
	const mk = getMk(userId, mkId);
	if (!mk) {
		return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
	}
	const rows = db
		.prepare(
			`SELECT id, nim, nama FROM mahasiswa WHERE mata_kuliah_id = ? ORDER BY nim`,
		)
		.all(mkId);
	return res.json(rows);
});

/** Menambahkan mahasiswa dengan guard NIM unik dalam satu MK. */
router.post('/:id/mahasiswa', (req, res) => {
	const userId = req.user.sub;
	const mkId = Number(req.params.id);
	const mk = getMk(userId, mkId);
	if (!mk) {
		return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
	}
	const { nim, nama } = req.body || {};
	if (!nim || !nama) {
		return res.status(400).json({ error: 'NIM dan nama wajib diisi' });
	}
	try {
		const info = db
			.prepare(
				`INSERT INTO mahasiswa (nim, nama, mata_kuliah_id) VALUES (?, ?, ?)`,
			)
			.run(nim, nama, mkId);
		const row = db
			.prepare(`SELECT id, nim, nama FROM mahasiswa WHERE id = ?`)
			.get(info.lastInsertRowid);
		return res.status(201).json(row);
	} catch (e) {
		if (String(e).includes('UNIQUE')) {
			return res
				.status(409)
				.json({ error: 'NIM sudah terdaftar pada mata kuliah ini' });
		}
		return res.status(500).json({ error: 'Gagal menambah mahasiswa' });
	}
});

router.get('/:id/nilai', listNilaiHandler);
router.post('/:id/nilai', saveNilaiBatchHandler);
router.post('/:id/hitung', hitungSemuaHandler);

export default router;
