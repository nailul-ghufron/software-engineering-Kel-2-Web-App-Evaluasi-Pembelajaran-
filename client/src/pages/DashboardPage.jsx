import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { deleteMataKuliah, fetchDashboardSummary, fetchMataKuliah } from "../services/api.js";

/** Menampilkan ringkasan MK milik dosen beserta pintasan kelola data dan penghapusan aman. */
export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setL] = useState(true);
  const [msg, setMsg] = useState("");

  /** Mengambil data dashboard dan ringkasan evaluasi dalam satu siklus refresh UI. */
  async function load() {
    setL(true);
    try {
      const [mkRows, dashboard] = await Promise.all([fetchMataKuliah(), fetchDashboardSummary()]);
      setRows(mkRows);
      setSummary(dashboard);
    } catch {
      setMsg("Gagal memuat data mata kuliah.");
    } finally {
      setL(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function hapus(id) {
    setMsg("");
    if (!window.confirm("Hapus mata kuliah ini?")) return;
    try {
      await deleteMataKuliah(id);
      await load();
    } catch (e) {
      const m = e.response?.data?.error || "Gagal menghapus.";
      setMsg(m);
    }
  }

  function statusLabel(status) {
    if (status === "SELESAI") return "Selesai";
    if (status === "SEBAGIAN") return "Sebagian";
    if (status === "BELUM_DIHITUNG") return "Belum hitung";
    return "Belum ada mhs";
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div className="editorial-header">
          <div>
            <p className="hint" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Academic Workspace
            </p>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Kelola mata kuliah dan evaluasi nilai mahasiswa.
            </p>
          </div>
          <Link to="/matakuliah/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
            + Tambah Mata Kuliah
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "0.9rem", marginBottom: "1.5rem" }}>
          <div className="stat-pill">
            <span className="hint" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Jumlah Mata Kuliah
            </span>
            <strong>{summary?.kpi?.jumlah_mk ?? rows.length}</strong>
          </div>
          <div className="stat-pill">
            <span className="hint" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Jumlah Mahasiswa
            </span>
            <strong>{summary?.kpi?.jumlah_mahasiswa ?? 0}</strong>
          </div>
          <div className="stat-pill">
            <span className="hint" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Rata Nilai Akhir
            </span>
            <strong>{summary?.kpi?.rata_nilai_akhir != null ? summary.kpi.rata_nilai_akhir.toFixed(2) : "—"}</strong>
          </div>
        </div>

        {msg && <div className="error-text" style={{ marginBottom: "0.75rem" }}>{msg}</div>}

        {!loading && summary && (
          <div className="card-soft" style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Distribusi Nilai Huruf</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(95px,1fr))", gap: "0.6rem" }}>
              {Object.entries(summary.distribusi_huruf || {}).map(([k, v]) => (
                <div key={k} className="card" style={{ padding: "0.8rem 0.95rem" }}>
                  <div className="hint" style={{ marginBottom: "0.25rem", textTransform: "uppercase" }}>
                    {k}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card-soft">
          {loading ? (
            <p style={{ padding: "1rem 1.25rem" }}>Memuat…</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode MK</th>
                    <th>Nama MK</th>
                    <th>Jumlah Mahasiswa</th>
                    <th>Status Evaluasi</th>
                    <th>Progress</th>
                    <th>Rata Akhir</th>
                    <th style={{ minWidth: 220 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.kode_mk}</td>
                      <td>{r.nama_mk}</td>
                      <td>{r.jumlah_mahasiswa}</td>
                      <td>
                        {statusLabel(
                          summary?.ringkasan_mk?.find((x) => x.id === r.id)?.status_evaluasi ?? "BELUM_DIHITUNG"
                        )}
                      </td>
                      <td>
                        {(summary?.ringkasan_mk?.find((x) => x.id === r.id)?.progress_hitung ?? 0)}%
                      </td>
                      <td>
                        {(() => {
                          const avg = summary?.ringkasan_mk?.find((x) => x.id === r.id)?.rata_nilai_akhir;
                          return avg == null ? "—" : Number(avg).toFixed(2);
                        })()}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                          <Link
                            to={`/matakuliah/${r.id}/nilai`}
                            className="btn btn-ghost"
                            style={{ fontSize: "0.85rem", textDecoration: "none" }}
                          >
                            Kelola
                          </Link>
                          <Link
                            to={`/matakuliah/${r.id}/edit`}
                            className="btn btn-ghost"
                            style={{ fontSize: "0.85rem", textDecoration: "none" }}
                          >
                            Edit MK
                          </Link>
                          <button type="button" className="btn btn-danger" style={{ fontSize: "0.85rem" }} onClick={() => hapus(r.id)}>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && summary?.mk_berisiko?.length > 0 && (
          <div className="card-soft" style={{ marginTop: "1rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.7rem" }}>Mata Kuliah Perlu Perhatian</h3>
            <div style={{ display: "grid", gap: "0.45rem" }}>
              {summary.mk_berisiko.map((mk) => (
                <div key={mk.id} className="card" style={{ padding: "0.8rem 1rem" }}>
                  <strong>{mk.kode_mk}</strong> — {mk.nama_mk} · Rata akhir{" "}
                  {mk.rata_nilai_akhir == null ? "—" : mk.rata_nilai_akhir.toFixed(2)} · Nilai rendah {mk.jumlah_rendah}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
