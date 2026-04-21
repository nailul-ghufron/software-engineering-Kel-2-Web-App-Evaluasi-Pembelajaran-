import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { createMataKuliah, fetchMataKuliah, updateMataKuliah } from "../services/api.js";

/** Form pembuatan atau pengeditan definisi MK termasuk normalisasi bobot persen ke pecahan desimal. */
export default function MataKuliahForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = Boolean(id && id !== "new");

  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [bt, setBt] = useState("");
  const [bu, setBu] = useState("");
  const [ba, setBa] = useState("");
  const [jt, setJt] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setL] = useState(false);

  const totalPct = useMemo(() => {
    const a = Number(bt);
    const b = Number(bu);
    const c = Number(ba);
    if ([a, b, c].some((x) => Number.isNaN(x))) return NaN;
    return a + b + c;
  }, [bt, bu, ba]);

  const bobotOk = !Number.isNaN(totalPct) && Math.abs(totalPct - 100) < 0.02;

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setL(true);
      try {
        const list = await fetchMataKuliah();
        const mk = list.find((x) => String(x.id) === String(id));
        if (!mk) {
          setErr("Mata kuliah tidak ditemukan.");
          return;
        }
        setKode(mk.kode_mk);
        setNama(mk.nama_mk);
        setBt(String(Math.round(mk.bobot_tugas * 10000) / 100));
        setBu(String(Math.round(mk.bobot_uts * 10000) / 100));
        setBa(String(Math.round(mk.bobot_uas * 10000) / 100));
        setJt(mk.jumlah_tugas);
      } catch {
        setErr("Gagal memuat mata kuliah.");
      } finally {
        setL(false);
      }
    })();
  }, [id, isEdit]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!bobotOk) {
      setErr("Total bobot harus tepat 100%.");
      return;
    }
    const body = {
      kode_mk: kode.trim(),
      nama_mk: nama.trim(),
      bobot_tugas: Number(bt) / 100,
      bobot_uts: Number(bu) / 100,
      bobot_uas: Number(ba) / 100,
      jumlah_tugas: Number(jt),
    };
    setL(true);
    try {
      if (isEdit) {
        await updateMataKuliah(id, body);
      } else {
        await createMataKuliah(body);
      }
      nav("/", { replace: true });
    } catch (e) {
      setErr(e.response?.data?.error || "Gagal menyimpan.");
    } finally {
      setL(false);
    }
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Link to="/" className="hint" style={{ display: "inline-block", marginBottom: "0.75rem" }}>
          ← Kembali ke dashboard
        </Link>
        <p className="hint" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Course Setup
        </p>
        <h1 className="page-title" style={{ marginBottom: "1.3rem" }}>
          {isEdit ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
        </h1>

        <div className="card" style={{ maxWidth: 560 }}>
          {loading && isEdit && !kode ? (
            <p>Memuat…</p>
          ) : (
            <form onSubmit={submit}>
              <div className="field">
                <label>Kode MK</label>
                <input value={kode} onChange={(e) => setKode(e.target.value)} required />
              </div>
              <div className="field">
                <label>Nama MK</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} required />
              </div>
              <div className="field">
                <label>Bobot Tugas (%)</label>
                <input type="number" step={0.01} min={0} max={100} value={bt} onChange={(e) => setBt(e.target.value)} required />
              </div>
              <div className="field">
                <label>Bobot UTS (%)</label>
                <input type="number" step={0.01} min={0} max={100} value={bu} onChange={(e) => setBu(e.target.value)} required />
              </div>
              <div className="field">
                <label>Bobot UAS (%)</label>
                <input type="number" step={0.01} min={0} max={100} value={ba} onChange={(e) => setBa(e.target.value)} required />
              </div>
              <div className="field">
                <label>Jumlah tugas</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={jt}
                  onChange={(e) => setJt(Number(e.target.value))}
                  required
                  disabled={isEdit}
                />
                {isEdit && (
                  <span className="hint">Jumlah tugas tidak dapat diubah setelah dibuat.</span>
                )}
              </div>

              <p className="hint">
                Total bobot:{" "}
                {Number.isNaN(totalPct) ? "—" : `${totalPct.toFixed(2)}%`}{" "}
                {!bobotOk && !Number.isNaN(totalPct) && "(harus 100%)"}
              </p>

              {err && <div className="error-text">{err}</div>}

              <button type="submit" className="btn btn-primary" disabled={!bobotOk || loading}>
                {loading ? "Menyimpan…" : "Simpan"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
