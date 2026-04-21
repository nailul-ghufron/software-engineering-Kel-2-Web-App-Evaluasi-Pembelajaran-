import db from '../db.js';
import {
	validasiRangeNilai,
	hitungRataRataTugas,
	hitungNilaiAkhir,
	konversiHuruf,
	validasiBobot,
} from '../services/kalkulasi.js';

function getMkOwned(userId, mkId) {
	return db
		.prepare('SELECT * FROM mata_kuliah WHERE id = ? AND pengguna_id = ?')
		.get(mkId, userId);
}

/** Mengembalikan gabungan mahasiswa dan nilai untuk satu mata kuliah milik pengguna. */
export function listNilaiHandler(req, res) {
	const userId = req.user.sub;
	const mkId = Number(req.params.id);
	const mk = getMkOwned(userId, mkId);
	if (!mk) {
		return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
	}
	const rows = db
		.prepare(
			`SELECT m.id AS mahasiswa_id, m.nim, m.nama,
              n.id AS nilai_id, n.nilai_tugas_json, n.nilai_uts, n.nilai_uas,
              n.rata_rata_tugas, n.nilai_akhir, n.nilai_huruf
       FROM mahasiswa m
       LEFT JOIN nilai n ON n.mahasiswa_id = m.id
       WHERE m.mata_kuliah_id = ?
       ORDER BY m.id DESC`,
		)
		.all(mkId);
	const parsed = rows.map((r) => {
		let tugas = [];
		try {
			tugas = r.nilai_tugas_json ? JSON.parse(r.nilai_tugas_json) : [];
		} catch {
			tugas = [];
		}
		while (tugas.length < mk.jumlah_tugas) tugas.push(null);
		return {
			mahasiswa_id: r.mahasiswa_id,
			nim: r.nim,
			nama: r.nama,
			nilai_id: r.nilai_id,
			nilai_tugas: tugas.slice(0, mk.jumlah_tugas),
			nilai_uts: r.nilai_uts,
			nilai_uas: r.nilai_uas,
			rata_rata_tugas: r.rata_rata_tugas,
			nilai_akhir: r.nilai_akhir,
			nilai_huruf: r.nilai_huruf,
		};
	});
	return res.json({ mata_kuliah: mk, items: parsed });
}

/** Menyimpan nilai secara massal dalam transaksi dengan validasi rentang dan jumlah tugas. */
export function saveNilaiBatchHandler(req, res) {
	const userId = req.user.sub;
	const mkId = Number(req.params.id);
	const mk = getMkOwned(userId, mkId);
	if (!mk) {
		return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
	}
	const items = Array.isArray(req.body?.items) ? req.body.items : [];
	if (items.length === 0) {
		return res.status(400).json({ error: 'Daftar nilai kosong' });
	}
	try {
		const upsert = db.transaction(() => {
			for (const it of items) {
				const mid = Number(it.mahasiswa_id);
				const mhs = db
					.prepare(
						'SELECT id FROM mahasiswa WHERE id = ? AND mata_kuliah_id = ?',
					)
					.get(mid, mkId);
				if (!mhs) {
					throw new Error('Mahasiswa tidak valid untuk mata kuliah ini');
				}
				let tugas = Array.isArray(it.nilai_tugas) ? [...it.nilai_tugas] : [];
				if (tugas.length !== mk.jumlah_tugas) {
					throw new Error(
						`Setiap mahasiswa harus memiliki ${mk.jumlah_tugas} nilai tugas`,
					);
				}
				tugas = tugas.map((v, i) => {
					if (v === null || v === '' || v === undefined) {
						throw new Error(`Tugas ${i + 1} wajib diisi (0-100)`);
					}
					return validasiRangeNilai(v, `Tugas ${i + 1}`);
				});
				const uts = validasiRangeNilai(it.nilai_uts, 'UTS');
				const uas = validasiRangeNilai(it.nilai_uas, 'UAS');
				const json = JSON.stringify(tugas);
				const existing = db
					.prepare('SELECT id FROM nilai WHERE mahasiswa_id = ?')
					.get(mid);
				if (existing) {
					db.prepare(
						`UPDATE nilai SET nilai_tugas_json = ?, nilai_uts = ?, nilai_uas = ? WHERE mahasiswa_id = ?`,
					).run(json, uts, uas, mid);
				} else {
					db.prepare(
						`INSERT INTO nilai (mahasiswa_id, nilai_tugas_json, nilai_uts, nilai_uas) VALUES (?, ?, ?, ?)`,
					).run(mid, json, uts, uas);
				}
			}
		});
		upsert();
		return res.json({ ok: true });
	} catch (e) {
		return res
			.status(400)
			.json({ error: e.message || 'Gagal menyimpan nilai' });
	}
}

/** Menghitung ulang rata tugas, nilai akhir, dan huruf untuk seluruh peserta pada MK tersebut. */
export function hitungSemuaHandler(req, res) {
	const userId = req.user.sub;
	const mkId = Number(req.params.id);
	const mk = getMkOwned(userId, mkId);
	if (!mk) {
		return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });
	}
	try {
		validasiBobot(mk.bobot_tugas, mk.bobot_uts, mk.bobot_uas);
	} catch (e) {
		return res.status(400).json({ error: e.message });
	}
	const mahasiswa = db
		.prepare(`SELECT id FROM mahasiswa WHERE mata_kuliah_id = ?`)
		.all(mkId);
	const update = db.transaction(() => {
		for (const { id: mid } of mahasiswa) {
			let row = db
				.prepare(`SELECT * FROM nilai WHERE mahasiswa_id = ?`)
				.get(mid);
			if (!row) {
				const empty = JSON.stringify(
					Array.from({ length: mk.jumlah_tugas }, () => null),
				);
				db.prepare(
					`INSERT INTO nilai (mahasiswa_id, nilai_tugas_json, nilai_uts, nilai_uas) VALUES (?, ?, ?, ?)`,
				).run(mid, empty, null, null);
				row = db.prepare(`SELECT * FROM nilai WHERE mahasiswa_id = ?`).get(mid);
			}
			let tugasArr = [];
			try {
				tugasArr = row.nilai_tugas_json ? JSON.parse(row.nilai_tugas_json) : [];
			} catch {
				tugasArr = [];
			}
			while (tugasArr.length < mk.jumlah_tugas) tugasArr.push(null);
			tugasArr = tugasArr.slice(0, mk.jumlah_tugas);
			const normalized = tugasArr.map((v) =>
				v === null || v === '' ? 0 : Number(v),
			);
			const rata = hitungRataRataTugas(normalized);
			const uVal = row.nilai_uts;
			const aVal = row.nilai_uas;
			const na = hitungNilaiAkhir({
				bobotTugas: mk.bobot_tugas,
				bobotUts: mk.bobot_uts,
				bobotUas: mk.bobot_uas,
				rataRataTugas: rata,
				nilaiUts: uVal ?? 0,
				nilaiUas: aVal ?? 0,
			});
			const huruf = konversiHuruf(na);
			db.prepare(
				`UPDATE nilai SET rata_rata_tugas = ?, nilai_akhir = ?, nilai_huruf = ? WHERE mahasiswa_id = ?`,
			).run(rata, na, huruf, mid);
		}
	});
	update();
	return res.json({ ok: true });
}
