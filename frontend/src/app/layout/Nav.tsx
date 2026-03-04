import { NavLink } from "react-router-dom";

export function Nav() {
  return (
    <aside className="appNav">
      <div className="brand">OpsFlow</div>

      <nav className="navLinks">
        <NavLink to="/app/incidents" className={({ isActive }) => (isActive ? "active" : "")}>
          Incidents
        </NavLink>
        <a className="disabled" title="Coming soon">
          Runbooks
        </a>
      </nav>

      <div className="navFooter">
        <div className="orgPill">Org: (soon)</div>
      </div>
    </aside>
  );
}
