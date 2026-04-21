import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

        <div style={{ marginTop: "1rem" }} className="card-soft">
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
