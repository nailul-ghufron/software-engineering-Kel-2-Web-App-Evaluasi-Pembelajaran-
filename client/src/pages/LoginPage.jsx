import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api.js";

/** Mengautentikasi pengguna dan menyimpan token agar lapisan UI mendapat sesi API. */
export default function LoginPage() {
  const nav = useNavigate();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          Web App Evaluasi Pembelajaran
        </p>
        <h1 style={{ marginTop: "0.35rem", marginBottom: "0.35rem", fontSize: "2rem", lineHeight: 1.05 }}>
          Masuk ke Aplikasi
          <br />
          Evaluasi Pembelajaran
        </h1>
        <p className="hint" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Kelola mata kuliah, nilai, dan hasil evaluasi pembelajaran dalam satu platform.
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
            <div className="password-input-wrap">
              <input
                id="p"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setP(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3.27 2 2 3.27l4.18 4.18C4.23 8.97 2.75 11.11 2 12c1.98 2.35 5.59 6 10 6 1.73 0 3.34-.56 4.72-1.35L20.73 20 22 18.73 3.27 2Zm8.47 10.29 2.97 2.97c-.73.46-1.6.74-2.52.74-2.62 0-4.74-2.12-4.74-4.74 0-.92.27-1.78.73-2.51l1.95 1.95a2.75 2.75 0 0 0 1.61 1.59Zm10.26-.29c-1.08-1.28-2.77-3.05-4.97-4.29l-1.5 1.5a7.66 7.66 0 0 1 2.67 2.79c-.57.67-1.56 1.77-2.91 2.71l1.45 1.45c2.2-1.45 3.88-3.44 5.26-5.16ZM12 6c2.62 0 4.74 2.12 4.74 4.74 0 .52-.08 1.02-.24 1.49l-3.95-3.95c-.18-.03-.36-.04-.55-.04Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5c4.42 0 8.02 3.65 10 7-1.98 3.35-5.58 7-10 7S3.98 15.35 2 12c1.98-3.35 5.58-7 10-7Zm0 2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5Zm0 2.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Z" />
                  </svg>
                )}
              </button>
            </div>
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
