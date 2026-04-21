import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { deleteMataKuliah, fetchMataKuliah } from "../services/api.js";

/** Menampilkan ringkasan MK milik dosen beserta pintasan kelola data dan penghapusan aman. */
export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setL] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setL(true);
    try {
      const data = await fetchMataKuliah();
      setRows(data);
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

        <div className="stat-pill" style={{ marginBottom: "1.5rem" }}>
          <span className="hint" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Jumlah Mata Kuliah
          </span>
          <strong>{rows.length}</strong>
        </div>

        {msg && <div className="error-text" style={{ marginBottom: "0.75rem" }}>{msg}</div>}

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
      </div>
    </div>
  );
}
