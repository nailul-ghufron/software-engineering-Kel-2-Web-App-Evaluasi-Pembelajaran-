import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api.js";

/** Mengautentikasi pengguna dan menyimpan token agar lapisan UI mendapat sesi API. */
export default function LoginPage() {
  const nav = useNavigate();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setL] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setL(true);
    try {
      const data = await login({ username, password });
      localStorage.setItem("token", data.token);
      nav("/", { replace: true });
    } catch {
      setErr("Login gagal. Periksa username atau password.");
    } finally {
      setL(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2.5rem",
        background:
          "radial-gradient(circle at 20% 20%, rgba(169,204,250,0.42) 0%, rgba(248,250,251,1) 45%)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 430, borderRadius: "24px", padding: "2.2rem" }}>
        <p className="hint" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          The Scholarly Sanctuary
        </p>
        <h1 style={{ marginTop: "0.35rem", marginBottom: "0.35rem", fontSize: "2rem", lineHeight: 1.05 }}>
          Masuk ke
          <br />
          Dashboard Dosen
        </h1>
        <p className="hint" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Kelola evaluasi pembelajaran dengan workspace yang lebih fokus dan terstruktur.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="u">Username</label>
            <input
              id="u"
              autoComplete="username"
              value={username}
              onChange={(e) => setU(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="p">Password</label>
            <input
              id="p"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setP(e.target.value)}
              required
            />
          </div>
          {err && <div className="error-text">{err}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
