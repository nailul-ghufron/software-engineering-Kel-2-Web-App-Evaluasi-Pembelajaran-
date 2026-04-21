import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "../components/Sidebar.jsx";
import ExportButton from "../components/ExportButton.jsx";
import { downloadExcel, fetchNilaiSet } from "../services/api.js";

function hurufColor(h) {
  if (h === "A") return "var(--success)";
  if (h === "E") return "var(--danger)";
  return "inherit";
}

/** Menampilkan snapshot nilai akhir dan mengunduh laporan Excel resmi untuk MK aktif. */
export default function HasilEvaluasiPage() {
  const { id: mkId } = useParams();
  const [mk, setMk] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setL] = useState(true);
  const [xBusy, setX] = useState(false);

  useEffect(() => {
    (async () => {
      setL(true);
      try {
        const data = await fetchNilaiSet(mkId);
        setMk(data.mata_kuliah);
        setItems(data.items);
      } finally {
        setL(false);
      }
    })();
  }, [mkId]);

  async function exportXlsx() {
    setX(true);
    try {
      await downloadExcel(mkId, mk?.kode_mk || "MK");
    } finally {
      setX(false);
    }
  }

  const pct = (b) => (b == null ? "—" : `${Math.round(Number(b) * 100)}%`);
  const rataKelas =
    items.length === 0
      ? null
      : items
          .map((x) => x.nilai_akhir)
          .filter((x) => x != null)
          .reduce((a, b, _, arr) => a + Number(b) / arr.length, 0);
  const nilaiAkhirList = useMemo(
    () =>
      items
        .map((x) => x.nilai_akhir)
        .filter((x) => x != null && Number.isFinite(Number(x)))
        .map((x) => Number(x)),
    [items]
  );

  const histogramData = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => {
      const start = i * 10;
      const end = i === 9 ? 100 : start + 9;
      return {
        range: `${start}-${end}`,
        jumlah: 0,
      };
    });

    nilaiAkhirList.forEach((nilai) => {
      const clamped = Math.max(0, Math.min(100, nilai));
      const idx = Math.min(9, Math.floor(clamped / 10));
      bins[idx].jumlah += 1;
    });

    return bins;
  }, [nilaiAkhirList]);

  const gradeDistributionData = useMemo(() => {
    const gradeMap = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    items.forEach((x) => {
      const huruf = String(x.nilai_huruf || "").toUpperCase();
      if (Object.prototype.hasOwnProperty.call(gradeMap, huruf)) {
        gradeMap[huruf] += 1;
      }
    });
    return Object.entries(gradeMap).map(([huruf, jumlah]) => ({ huruf, jumlah }));
  }, [items]);
  const hasHistogramData = histogramData.some((x) => x.jumlah > 0);
  const hasGradeData = gradeDistributionData.some((x) => x.jumlah > 0);

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
              Final Report
            </p>
            <h1 className="page-title">Hasil Evaluasi</h1>
            {mk && (
              <p className="page-subtitle">
                {mk.kode_mk} — {mk.nama_mk}
              </p>
            )}
          </div>
          <ExportButton loading={xBusy} onClick={exportXlsx} />
        </div>

        <div className="card-soft hasil-chart-section">
          <div className="hasil-chart-grid">
            <div className="hasil-chart-card">
              <h3 className="hasil-chart-title">Sebaran Nilai Akhir</h3>
              {loading ? (
                <p className="hint">Menyiapkan grafik...</p>
              ) : hasHistogramData ? (
                <div className="hasil-chart-canvas" aria-label="Histogram nilai akhir">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(89, 96, 99, 0.18)" />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                      <Tooltip formatter={(value) => [`${value} mahasiswa`, "Jumlah"]} />
                      <Bar dataKey="jumlah" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="hasil-chart-empty">Belum ada nilai akhir untuk divisualisasikan.</div>
              )}
            </div>

            <div className="hasil-chart-card">
              <h3 className="hasil-chart-title">Distribusi Nilai Huruf</h3>
              {loading ? (
                <p className="hint">Menyiapkan grafik...</p>
              ) : hasGradeData ? (
                <div className="hasil-chart-canvas" aria-label="Bar chart distribusi nilai huruf">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistributionData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(89, 96, 99, 0.18)" />
                      <XAxis dataKey="huruf" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                      <Tooltip formatter={(value) => [`${value} mahasiswa`, "Jumlah"]} />
                      <Bar dataKey="jumlah" fill="var(--secondary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="hasil-chart-empty">Belum ada nilai huruf untuk divisualisasikan.</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }} className="card-soft">
          {rataKelas != null && (
            <div className="hint" style={{ marginBottom: "0.65rem" }}>
              Rata-rata nilai akhir kelas: <strong style={{ color: "var(--text)" }}>{rataKelas.toFixed(2)}</strong>
            </div>
          )}
          {loading ? (
            <p style={{ padding: "1rem" }}>Memuat…</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>NIM</th>
                    <th>Nama</th>
                    <th>Rata-rata Tugas</th>
                    <th>% Tugas</th>
                    <th>UTS</th>
                    <th>% UTS</th>
                    <th>UAS</th>
                    <th>% UAS</th>
                    <th>Nilai Akhir</th>
                    <th>Nilai Huruf</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.mahasiswa_id}>
                      <td>{r.nim}</td>
                      <td>{r.nama}</td>
                      <td>{r.rata_rata_tugas != null ? Number(r.rata_rata_tugas).toFixed(2) : "—"}</td>
                      <td>{pct(mk?.bobot_tugas)}</td>
                      <td>{r.nilai_uts != null ? Number(r.nilai_uts).toFixed(2) : "—"}</td>
                      <td>{pct(mk?.bobot_uts)}</td>
                      <td>{r.nilai_uas != null ? Number(r.nilai_uas).toFixed(2) : "—"}</td>
                      <td>{pct(mk?.bobot_uas)}</td>
                      <td>{r.nilai_akhir != null ? Number(r.nilai_akhir).toFixed(2) : "—"}</td>
                      <td style={{ fontWeight: 700, color: hurufColor(r.nilai_huruf) }}>
                        {r.nilai_huruf || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="hint" style={{ marginTop: "1rem" }}>
          <Link to={`/matakuliah/${mkId}/nilai`}>Kembali ke input nilai</Link>
        </p>
      </div>
    </div>
  );
}
