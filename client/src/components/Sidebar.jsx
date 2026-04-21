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
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand">
        <div className="sidebar-brand-label">
          Workspace
        </div>
        <div className="sidebar-brand-title">
          Evaluasi
          <br />
          Pembelajaran
        </div>
      </Link>
      <nav className="sidebar-nav">
        <SidebarLink to="/" end>
          Dashboard
        </SidebarLink>
        <SidebarLink to="/matakuliah/new">Buat mata kuliah</SidebarLink>
        {mkBase && kodeMk && (
          <>
            <div className="sidebar-section-label">
              {kodeMk}
            </div>
            <SidebarLink to={`${mkBase}/nilai`}>Input nilai</SidebarLink>
            <SidebarLink to={`${mkBase}/hasil`}>Hasil evaluasi</SidebarLink>
          </>
        )}
      </nav>
      <div className="sidebar-actions">
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
