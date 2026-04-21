import { Link, NavLink, useNavigate } from "react-router-dom";

/** Menyediakan navigasi primer sidebar dengan status aktif untuk orientasi pengguna. */
export default function Sidebar({ mkId, kodeMk }) {
  const nav = useNavigate();
  const mkBase = mkId ? `/matakuliah/${mkId}` : null;

  /** Mengakhiri sesi aktif pengguna dan kembali ke halaman login secara aman. */
  function handleLogout() {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  }

  return (
    <aside
      style={{
        width: 260,
        minHeight: "100vh",
        background: "var(--surface-low)",
        padding: "2rem 1.2rem",
      }}
    >
      <Link to="/" style={{ display: "block", marginBottom: "2rem", textDecoration: "none" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Workspace
        </div>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: "0.25rem", lineHeight: 1.2, color: "var(--text)" }}>
          Evaluasi
          <br />
          Pembelajaran
        </div>
      </Link>
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        <SidebarLink to="/" end>
          Dashboard
        </SidebarLink>
        <SidebarLink to="/matakuliah/new">Buat mata kuliah</SidebarLink>
        {mkBase && kodeMk && (
          <>
            <div
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
                marginTop: "1rem",
                marginBottom: "0.2rem",
              }}
            >
              {kodeMk}
            </div>
            <SidebarLink to={`${mkBase}/nilai`}>Input nilai</SidebarLink>
            <SidebarLink to={`${mkBase}/hasil`}>Hasil evaluasi</SidebarLink>
          </>
        )}
      </nav>
      <div style={{ marginTop: "1.5rem" }}>
        <button type="button" className="btn btn-ghost" style={{ width: "100%" }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        padding: "0.65rem 0.8rem",
        borderRadius: "12px",
        color: isActive ? "#f7f9ff" : "var(--muted)",
        background: isActive
          ? "linear-gradient(135deg, var(--primary), var(--primary-dim))"
          : "transparent",
        fontWeight: isActive ? 700 : 600,
        fontSize: "0.86rem",
        textDecoration: "none",
      })}
    >
      {children}
    </NavLink>
  );
}
