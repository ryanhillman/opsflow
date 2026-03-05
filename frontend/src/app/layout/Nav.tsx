import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

const DEV_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DEV_ORG_LABEL = "Dev Org";

function emailFromToken(token: string | null): string {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? payload.email ?? "";
  } catch {
    return "";
  }
}

export function Nav() {
  const { logout, accessToken } = useAuth();
  const nav = useNavigate();
  const email = emailFromToken(accessToken);

  function handleLogout() {
    logout();
    nav("/login", { replace: true });
  }

  return (
    <header className="appTopbar">
      <div className="topbarBrand">OpsFlow</div>

      <div className="topbarOrg">
        {DEV_ORG_LABEL}
        <span style={{ marginLeft: 6, opacity: 0.6, fontFamily: "monospace", fontSize: 11 }}>
          {DEV_ORG_ID}
        </span>
      </div>

      <nav className="topbarNav">
        <NavLink to="/app/incidents" className={({ isActive }) => (isActive ? "active" : "")}>
          Incidents
        </NavLink>
        <NavLink to="/app/services" className={({ isActive }) => (isActive ? "active" : "")}>
          Services
        </NavLink>
        <a className="disabled" aria-disabled="true" title="Coming soon">
          Runbooks
        </a>
      </nav>

      <div className="topbarUser">
        {email && <span className="subtle" style={{ fontSize: 12 }}>{email}</span>}
        <button type="button" className="btnGhost" style={{ padding: "5px 12px", fontSize: 13 }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
