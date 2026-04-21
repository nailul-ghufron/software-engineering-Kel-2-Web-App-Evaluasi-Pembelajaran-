import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NilaiTable from '../components/NilaiTable.jsx';
import Sidebar from '../components/Sidebar.jsx';
import {
	addMahasiswa,
	deleteMahasiswa,
	fetchNilaiSet,
	hitungSemua,
	saveNilaiBatch,
} from '../services/api.js';

function inRange(v) {
	if (v === '' || v === null || v === undefined) return true;
	const n = Number(v);
	return !Number.isNaN(n) && n >= 0 && n <= 100;
}

/** Mengelola entri nilai per mahasiswa, validasi rentang, simpan batch, dan hitung agregat. */
export default function InputNilaiPage() {
	const { id: mkId } = useParams();
	const [mk, setMk] = useState(null);
	const [items, setItems] = useState([]);
	const [loading, setL] = useState(true);
	const [busy, setB] = useState(false);
	const [msg, setMsg] = useState('');
	const [errors, setErrors] = useState({});

	const [showAdd, setShowAdd] = useState(false);
	const [nim, setNim] = useState('');
	const [nama, setNama] = useState('');
	const [sortState, setSortState] = useState({ key: null, direction: null });

	const reload = useCallback(async () => {
		setL(true);
		try {
			const data = await fetchNilaiSet(mkId);
			setMk(data.mata_kuliah);
			setItems(
				data.items.map((it) => ({
					...it,
					nilai_tugas: [...it.nilai_tugas],
				})),
			);
		} catch {
			setMsg('Gagal memuat nilai.');
		} finally {
			setL(false);
		}
	}, [mkId]);

	useEffect(() => {
		reload();
	}, [reload]);

	useEffect(() => {
		if (!showAdd) return undefined;
		function onEsc(event) {
			if (event.key === 'Escape') setShowAdd(false);
		}
		window.addEventListener('keydown', onEsc);
		return () => window.removeEventListener('keydown', onEsc);
	}, [showAdd]);

	function validateAll() {
		const e = {};
		if (!mk) return {};
		items.forEach((row) => {
			const id = row.mahasiswa_id;
			row.nilai_tugas.forEach((v, ti) => {
				if (!inRange(v)) e[`${id}-t-${ti}`] = '0–100';
			});
			if (
				row.nilai_uts !== null &&
				row.nilai_uts !== undefined &&
				row.nilai_uts !== '' &&
				!inRange(row.nilai_uts)
			) {
				e[`${id}-uts`] = '0–100';
			}
			if (
				row.nilai_uas !== null &&
				row.nilai_uas !== undefined &&
				row.nilai_uas !== '' &&
				!inRange(row.nilai_uas)
			) {
				e[`${id}-uas`] = '0–100';
			}
		});
		return e;
	}

	function onCellChange(mahasiswaId, kind, ti, val) {
		setMsg('');
		setItems((prev) => {
			const next = prev.map((r) => ({ ...r, nilai_tugas: [...r.nilai_tugas] }));
			const row = next.find((r) => r.mahasiswa_id === mahasiswaId);
			if (!row) return prev;
			if (kind === 'tugas') {
				row.nilai_tugas[ti] = val;
			} else if (kind === 'uts') {
				row.nilai_uts = val === '' ? null : val;
			} else if (kind === 'uas') {
				row.nilai_uas = val === '' ? null : val;
			}
			return next;
		});
	}

	const displayItems = useMemo(() => {
		if (!sortState.key || !sortState.direction) return items;
		const sorted = [...items];
		const factor = sortState.direction === 'asc' ? 1 : -1;
		if (sortState.key === 'nim') {
			sorted.sort((a, b) => {
				const aNim = String(a.nim ?? '');
				const bNim = String(b.nim ?? '');
				return aNim.localeCompare(bNim, undefined, { numeric: true }) * factor;
			});
		}
		if (sortState.key === 'nama') {
			sorted.sort((a, b) => {
				const aNama = String(a.nama ?? '');
				const bNama = String(b.nama ?? '');
				return (
					aNama.localeCompare(bNama, undefined, { sensitivity: 'base' }) * factor
				);
			});
		}
		return sorted;
	}, [items, sortState]);

	function onSortToggle(key) {
		setSortState((prev) => {
			if (prev.key !== key) return { key, direction: 'asc' };
			if (prev.direction === 'asc') return { key, direction: 'desc' };
			if (prev.direction === 'desc') return { key: null, direction: null };
			return { key, direction: 'asc' };
		});
	}

	async function simpan() {
		setMsg('');
		const e = validateAll();
		setErrors(e);
		if (Object.keys(e).length) {
			setMsg('Perbaiki isian yang bertanda error.');
			return;
		}
		const payload = items.map((row) => ({
			mahasiswa_id: row.mahasiswa_id,
			nilai_tugas: row.nilai_tugas.map((v) =>
				v === '' || v === null || v === undefined ? 0 : Number(v),
			),
			nilai_uts:
				row.nilai_uts === '' || row.nilai_uts === null || row.nilai_uts === undefined
					? 0
					: Number(row.nilai_uts),
			nilai_uas:
				row.nilai_uas === '' || row.nilai_uas === null || row.nilai_uas === undefined
					? 0
					: Number(row.nilai_uas),
		}));
		setB(true);
		try {
			await saveNilaiBatch(mkId, payload);
			setMsg('Nilai disimpan.');
			await reload();
		} catch (err) {
			setMsg(err.response?.data?.error || 'Gagal menyimpan.');
		} finally {
			setB(false);
		}
	}

	async function hitung() {
		setMsg('');
		setB(true);
		try {
			await hitungSemua(mkId);
			setMsg('Nilai akhir dihitung.');
			await reload();
		} catch (err) {
			setMsg(err.response?.data?.error || 'Gagal menghitung.');
		} finally {
			setB(false);
		}
	}

	async function tambahMahasiswa(e) {
		e.preventDefault();
		setMsg('');
		setB(true);
		try {
			await addMahasiswa(mkId, { nim: nim.trim(), nama: nama.trim() });
			setNim('');
			setNama('');
			setShowAdd(false);
			await reload();
		} catch (err) {
			setMsg(err.response?.data?.error || 'Gagal menambah mahasiswa.');
		} finally {
			setB(false);
		}
	}

	async function hapus(mhsId) {
		if (!window.confirm('Hapus mahasiswa dan nilainya?')) return;
		setB(true);
		try {
			await deleteMahasiswa(mhsId);
			await reload();
		} catch {
			setMsg('Gagal menghapus mahasiswa.');
		} finally {
			setB(false);
		}
	}

	const terisi = items.filter((x) => x.nilai_akhir != null).length;

	if (loading && !mk) {
		return (
			<div className="layout">
				<Sidebar />
				<div className="main">Memuat…</div>
			</div>
		);
	}

	return (
		<div className="layout">
			<Sidebar
				mkId={mkId}
				kodeMk={mk?.kode_mk}
			/>
			<div className="main">
				<Link
					to="/"
					className="hint"
					style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
					← Dashboard
				</Link>

				<div className="editorial-header">
					<div>
						<p
							className="hint"
							style={{
								margin: 0,
								textTransform: 'uppercase',
								letterSpacing: '0.08em',
							}}>
							Score Workspace
						</p>
						<h1 className="page-title">Input Nilai</h1>
						{mk && (
							<p className="page-subtitle">
								{mk.kode_mk} — {mk.nama_mk} · Bobot tugas{' '}
								{(mk.bobot_tugas * 100).toFixed(2)}%, UTS{' '}
								{(mk.bobot_uts * 100).toFixed(2)}%, UAS{' '}
								{(mk.bobot_uas * 100).toFixed(2)}%
							</p>
						)}
					</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
						<button
							type="button"
							className="btn btn-ghost"
							onClick={() => setShowAdd(true)}
							disabled={busy}>
							+ Tambah Mahasiswa
						</button>
						<button
							type="button"
							className="btn btn-ghost"
							onClick={hitung}
							disabled={busy}>
							Hitung Semua Nilai
						</button>
						<button
							type="button"
							className="btn btn-primary"
							onClick={simpan}
							disabled={busy}>
							Simpan Semua
						</button>
						<Link
							to={`/matakuliah/${mkId}/hasil`}
							className="btn btn-ghost"
							style={{ textDecoration: 'none' }}>
							Lihat hasil
						</Link>
					</div>
				</div>

				{!loading && (
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
							gap: '0.65rem',
							marginBottom: '0.9rem',
						}}>
						<div
							className="card"
							style={{ padding: '0.8rem 1rem' }}>
							<div className="hint">Total Mahasiswa</div>
							<strong style={{ fontSize: '1.25rem' }}>{items.length}</strong>
						</div>
						<div
							className="card"
							style={{ padding: '0.8rem 1rem' }}>
							<div className="hint">Sudah Dihitung</div>
							<strong style={{ fontSize: '1.25rem' }}>{terisi}</strong>
						</div>
						<div
							className="card"
							style={{ padding: '0.8rem 1rem' }}>
							<div className="hint">Progress</div>
							<strong style={{ fontSize: '1.25rem' }}>
								{items.length ? Math.round((terisi / items.length) * 100) : 0}%
							</strong>
						</div>
					</div>
				)}

				{msg && (
					<div
						style={{
							marginTop: '0.75rem',
							color:
								msg.startsWith('Gagal') || msg.includes('Perbaiki')
									? '#fca5a5'
									: 'var(--success)',
						}}>
						{msg}
					</div>
				)}

				{showAdd && (
					<div
						className="modal-overlay"
						onClick={() => !busy && setShowAdd(false)}
						role="presentation">
						<div
							className="modal-dialog"
							role="dialog"
							aria-modal="true"
							aria-labelledby="modal-tambah-mahasiswa-title"
							onClick={(e) => e.stopPropagation()}>
							<div className="modal-header">
								<h3
									id="modal-tambah-mahasiswa-title"
									style={{ margin: 0 }}>
									Mahasiswa baru
								</h3>
								<button
									type="button"
									className="modal-close"
									onClick={() => setShowAdd(false)}
									disabled={busy}
									aria-label="Tutup modal tambah mahasiswa">
									×
								</button>
							</div>
							<form
								className="modal-body"
								onSubmit={tambahMahasiswa}>
								<div className="field">
									<label>NIM</label>
									<input
										value={nim}
										onChange={(e) => setNim(e.target.value)}
										required
									/>
								</div>
								<div className="field">
									<label>Nama</label>
									<input
										value={nama}
										onChange={(e) => setNama(e.target.value)}
										required
									/>
								</div>
								<div style={{ display: 'flex', gap: '0.5rem' }}>
									<button
										type="submit"
										className="btn btn-primary"
										disabled={busy}>
										Simpan
									</button>
									<button
										type="button"
										className="btn btn-ghost"
										onClick={() => setShowAdd(false)}
										disabled={busy}>
										Batal
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				<div style={{ marginTop: '1rem' }}>
					{items.length === 0 ? (
						<div className="card-soft">
							Belum ada mahasiswa pada mata kuliah ini. Tambahkan mahasiswa dulu
							sebelum input nilai.
						</div>
					) : (
						<NilaiTable
							mk={mk}
							items={displayItems}
							errors={errors}
							onCellChange={onCellChange}
							onDeleteRow={hapus}
							sortState={sortState}
							onSortToggle={onSortToggle}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
