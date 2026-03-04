import { Outlet } from "react-router-dom";
import { Nav } from "./Nav";

export function AppLayout() {
  return (
    <div className="appShell">
      <Nav />
      <main className="appMain">
        <Outlet />
      </main>
    </div>
  );
}
