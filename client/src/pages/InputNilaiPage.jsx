import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import NilaiTable from "../components/NilaiTable.jsx";
import {
  addMahasiswa,
  deleteMahasiswa,
  fetchNilaiSet,
  hitungSemua,
  saveNilaiBatch,
} from "../services/api.js";

function inRange(v) {
  if (v === "" || v === null || v === undefined) return true;
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
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  const [showAdd, setShowAdd] = useState(false);
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");

  const reload = useCallback(async () => {
    setL(true);
    try {
      const data = await fetchNilaiSet(mkId);
      setMk(data.mata_kuliah);
      setItems(
        data.items.map((it) => ({
          ...it,
          nilai_tugas: [...it.nilai_tugas],
        }))
      );
    } catch {
      setMsg("Gagal memuat nilai.");
    } finally {
      setL(false);
    }
  }, [mkId]);

  useEffect(() => {
    reload();
  }, [reload]);

  function validateAll() {
    const e = {};
    if (!mk) return {};
    items.forEach((row, ri) => {
      row.nilai_tugas.forEach((v, ti) => {
        if (!inRange(v)) e[`${ri}-t-${ti}`] = "0–100";
        if (v === "" || v === null || v === undefined) e[`${ri}-t-${ti}`] = "Wajib";
      });
      if (row.nilai_uts !== null && row.nilai_uts !== undefined && row.nilai_uts !== "" && !inRange(row.nilai_uts)) {
        e[`${ri}-uts`] = "0–100";
      }
      if (row.nilai_uas !== null && row.nilai_uas !== undefined && row.nilai_uas !== "" && !inRange(row.nilai_uas)) {
        e[`${ri}-uas`] = "0–100";
      }
    });
    return e;
  }

  function onCellChange(ri, kind, ti, val) {
    setMsg("");
    setItems((prev) => {
      const next = prev.map((r) => ({ ...r, nilai_tugas: [...r.nilai_tugas] }));
      const row = next[ri];
      if (kind === "tugas") {
        row.nilai_tugas[ti] = val;
      } else if (kind === "uts") {
        row.nilai_uts = val === "" ? null : val;
      } else if (kind === "uas") {
        row.nilai_uas = val === "" ? null : val;
      }
      return next;
    });
  }

  async function simpan() {
    setMsg("");
    const e = validateAll();
    setErrors(e);
    if (Object.keys(e).length) {
      setMsg("Perbaiki isian yang bertanda error.");
      return;
    }
    const payload = items.map((row) => ({
      mahasiswa_id: row.mahasiswa_id,
      nilai_tugas: row.nilai_tugas.map((v) => Number(v)),
      nilai_uts: row.nilai_uts === "" || row.nilai_uts === null ? null : Number(row.nilai_uts),
      nilai_uas: row.nilai_uas === "" || row.nilai_uas === null ? null : Number(row.nilai_uas),
    }));
    setB(true);
    try {
      await saveNilaiBatch(mkId, payload);
      setMsg("Nilai disimpan.");
      await reload();
    } catch (err) {
      setMsg(err.response?.data?.error || "Gagal menyimpan.");
    } finally {
      setB(false);
    }
  }

  async function hitung() {
    setMsg("");
    setB(true);
    try {
      await hitungSemua(mkId);
      setMsg("Nilai akhir dihitung.");
      await reload();
    } catch (err) {
      setMsg(err.response?.data?.error || "Gagal menghitung.");
    } finally {
      setB(false);
    }
  }

  async function tambahMahasiswa(e) {
    e.preventDefault();
    setMsg("");
    setB(true);
    try {
      await addMahasiswa(mkId, { nim: nim.trim(), nama: nama.trim() });
      setNim("");
      setNama("");
      setShowAdd(false);
      await reload();
    } catch (err) {
      setMsg(err.response?.data?.error || "Gagal menambah mahasiswa.");
    } finally {
      setB(false);
    }
  }

  async function hapus(mhsId) {
    if (!window.confirm("Hapus mahasiswa dan nilainya?")) return;
    setB(true);
    try {
      await deleteMahasiswa(mhsId);
      await reload();
    } catch {
      setMsg("Gagal menghapus mahasiswa.");
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
      <Sidebar mkId={mkId} kodeMk={mk?.kode_mk} />
      <div className="main">
        <Link to="/" className="hint" style={{ display: "inline-block", marginBottom: "0.75rem" }}>
          ← Dashboard
        </Link>

        <div className="editorial-header">
          <div>
            <p className="hint" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Score Workspace
            </p>
            <h1 className="page-title">Input Nilai</h1>
            {mk && (
              <p className="page-subtitle">
                {mk.kode_mk} — {mk.nama_mk} · Bobot tugas {(mk.bobot_tugas * 100).toFixed(2)}%, UTS{" "}
                {(mk.bobot_uts * 100).toFixed(2)}%, UAS {(mk.bobot_uas * 100).toFixed(2)}%
              </p>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(true)} disabled={busy}>
              + Tambah Mahasiswa
            </button>
            <button type="button" className="btn btn-ghost" onClick={hitung} disabled={busy}>
              Hitung Semua Nilai
            </button>
            <button type="button" className="btn btn-primary" onClick={simpan} disabled={busy}>
              Simpan Semua
            </button>
            <Link to={`/matakuliah/${mkId}/hasil`} className="btn btn-ghost" style={{ textDecoration: "none" }}>
              Lihat hasil
            </Link>
          </div>
        </div>

        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0.65rem", marginBottom: "0.9rem" }}>
            <div className="card" style={{ padding: "0.8rem 1rem" }}>
              <div className="hint">Total Mahasiswa</div>
              <strong style={{ fontSize: "1.25rem" }}>{items.length}</strong>
            </div>
            <div className="card" style={{ padding: "0.8rem 1rem" }}>
              <div className="hint">Sudah Dihitung</div>
              <strong style={{ fontSize: "1.25rem" }}>{terisi}</strong>
            </div>
            <div className="card" style={{ padding: "0.8rem 1rem" }}>
              <div className="hint">Progress</div>
              <strong style={{ fontSize: "1.25rem" }}>{items.length ? Math.round((terisi / items.length) * 100) : 0}%</strong>
            </div>
          </div>
        )}

        {msg && (
          <div
            style={{
              marginTop: "0.75rem",
              color: msg.startsWith("Gagal") || msg.includes("Perbaiki") ? "#fca5a5" : "var(--success)",
            }}
          >
            {msg}
          </div>
        )}

        {showAdd && (
          <div className="card" style={{ marginTop: "1rem", maxWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>Mahasiswa baru</h3>
            <form onSubmit={tambahMahasiswa}>
              <div className="field">
                <label>NIM</label>
                <input value={nim} onChange={(e) => setNim(e.target.value)} required />
              </div>
              <div className="field">
                <label>Nama</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  Simpan
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ marginTop: "1rem" }}>
          {items.length === 0 ? (
            <div className="card-soft">
              Belum ada mahasiswa pada mata kuliah ini. Tambahkan mahasiswa dulu sebelum input nilai.
            </div>
          ) : (
            <NilaiTable
              mk={mk}
              items={items}
              errors={errors}
              onCellChange={onCellChange}
              onDeleteRow={hapus}
            />
          )}
        </div>
      </div>
    </div>
  );
}
