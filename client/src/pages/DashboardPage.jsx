import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiAward,
  FiBookOpen,
  FiEdit2,
  FiHash,
  FiPercent,
  FiSettings,
  FiTrash2,
  FiType,
  FiUsers,
} from "react-icons/fi";
import Sidebar from "../components/Sidebar.jsx";
import { deleteMataKuliah, fetchDashboardSummary, fetchMataKuliah } from "../services/api.js";

/** Menampilkan ringkasan MK milik dosen beserta pintasan kelola data dan penghapusan aman. */
export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setL] = useState(true);
  const [msg, setMsg] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [chartProgress, setChartProgress] = useState(0);

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

  const distribusiEntries = Object.entries(summary?.distribusi_huruf || {});
  const distribusiTotal = distribusiEntries.reduce((acc, [, nilai]) => acc + Number(nilai || 0), 0);
  const donutColors = ["#0b5ed7", "#6f42c1", "#198754", "#fd7e14", "#dc3545", "#20c997", "#212529"];

  let offsetPercent = 0;
  const donutSegments = distribusiEntries.map(([huruf, jumlah], index) => {
    const value = Number(jumlah || 0);
    const percent = distribusiTotal > 0 ? (value / distribusiTotal) * 100 : 0;
    const start = offsetPercent;
    const end = offsetPercent + percent;
    offsetPercent = end;
    return {
      huruf,
      value,
      percent,
      start,
      end,
      color: donutColors[index % donutColors.length],
    };
  });

  useEffect(() => {
    if (loading) return;
    setChartProgress(0);

    const durationMs = 850;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now) => {
      const elapsed = now - startTime;
      const raw = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      setChartProgress(eased);
      if (raw < 1) rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [loading, summary]);

  const donutBackground = useMemo(() => {
    if (distribusiTotal <= 0) return "conic-gradient(#dce4e6 0% 100%)";

    const revealUntil = 100 * chartProgress;
    const gradientParts = [];

    donutSegments.forEach((segment) => {
      const visibleEnd = Math.min(segment.end, revealUntil);
      if (visibleEnd > segment.start) {
        gradientParts.push(
          `${segment.color} ${segment.start.toFixed(2)}% ${visibleEnd.toFixed(2)}%`
        );
      }
    });

    if (revealUntil < 100) {
      gradientParts.push(`#dce4e6 ${revealUntil.toFixed(2)}% 100%`);
    }

    return `conic-gradient(${gradientParts.join(", ")})`;
  }, [chartProgress, distribusiTotal, donutSegments]);

  function handleDonutMouseMove(event) {
    if (!distribusiTotal) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const radius = rect.width / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Hanya aktifkan tooltip di area cincin donut, bukan di lubang tengah.
    if (distance < radius * 0.31 || distance > radius) {
      setHoverInfo(null);
      return;
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const angleFromTop = (angle + 90 + 360) % 360;
    const percent = (angleFromTop / 360) * 100;

    const activeSegment =
      donutSegments.find((segment) => percent >= segment.start && percent < segment.end) ||
      donutSegments[donutSegments.length - 1];

    if (!activeSegment || activeSegment.value === 0) {
      setHoverInfo(null);
      return;
    }

    setHoverInfo({
      segment: activeSegment,
      x,
      y,
    });
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
            <span className="stat-pill-icon" aria-hidden="true">
              <FiBookOpen />
            </span>
            <span className="hint" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Jumlah Mata Kuliah
            </span>
            <strong>{summary?.kpi?.jumlah_mk ?? rows.length}</strong>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon" aria-hidden="true">
              <FiUsers />
            </span>
            <span className="hint" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Jumlah Mahasiswa
            </span>
            <strong>{summary?.kpi?.jumlah_mahasiswa ?? 0}</strong>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon" aria-hidden="true">
              <FiAward />
            </span>
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
            <div className="distribusi-layout">
              <div className="distribusi-chart-wrap">
                <div
                  className="distribusi-donut"
                  style={{ background: donutBackground }}
                  onMouseMove={handleDonutMouseMove}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  <div className="distribusi-donut-center">
                    <span className="hint">Total Nilai</span>
                    <strong>{distribusiTotal}</strong>
                    {distribusiTotal === 0 && <small>Belum ada data</small>}
                  </div>
                  {hoverInfo && (
                    <div
                      className="distribusi-tooltip"
                      style={{ left: `${hoverInfo.x}px`, top: `${hoverInfo.y}px` }}
                    >
                      <strong>{hoverInfo.segment.huruf}</strong>
                      <span>
                        {hoverInfo.segment.value} mahasiswa ({hoverInfo.segment.percent.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="distribusi-summary-list">
                {donutSegments.map((item) => (
                  <div key={item.huruf} className="distribusi-summary-item">
                    <div className="distribusi-summary-left">
                      <span className="distribusi-dot" style={{ backgroundColor: item.color }} />
                      <span className="distribusi-grade">{item.huruf}</span>
                    </div>
                    <div className="distribusi-summary-right">
                      <strong>{item.value}</strong>
                      <span className="hint">{item.percent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
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
                    <th>
                      <span className="table-head-inline">
                        <span className="table-head-icon"><FiHash /></span>
                        Kode MK
                      </span>
                    </th>
                    <th>
                      <span className="table-head-inline">
                        <span className="table-head-icon"><FiType /></span>
                        Nama MK
                      </span>
                    </th>
                    <th>
                      <span className="table-head-inline">
                        <span className="table-head-icon"><FiUsers /></span>
                        Jumlah Mahasiswa
                      </span>
                    </th>
                    <th>
                      <span className="table-head-inline">
                        <span className="table-head-icon"><FiActivity /></span>
                        Status Evaluasi
                      </span>
                    </th>
                    <th>
                      <span className="table-head-inline">
                        <span className="table-head-icon"><FiPercent /></span>
                        Progress
                      </span>
                    </th>
                    <th>
                      <span className="table-head-inline">
                        <span className="table-head-icon"><FiAward /></span>
                        Rata Akhir
                      </span>
                    </th>
                    <th style={{ minWidth: 220 }}>
                      <span className="table-head-inline">
                        <span className="table-head-icon"><FiSettings /></span>
                        Aksi
                      </span>
                    </th>
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
                        <div className="aksi-inline">
                          <Link
                            to={`/matakuliah/${r.id}/nilai`}
                            className="btn btn-ghost btn-icon-only"
                            style={{ fontSize: "0.85rem", textDecoration: "none" }}
                            aria-label="Kelola"
                            title="Kelola"
                          >
                            <FiSettings />
                          </Link>
                          <Link
                            to={`/matakuliah/${r.id}/edit`}
                            className="btn btn-ghost btn-icon-only"
                            style={{ fontSize: "0.85rem", textDecoration: "none" }}
                            aria-label="Edit MK"
                            title="Edit MK"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon-only"
                            style={{ fontSize: "0.85rem" }}
                            onClick={() => hapus(r.id)}
                            aria-label="Hapus"
                            title="Hapus"
                          >
                            <FiTrash2 />
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
