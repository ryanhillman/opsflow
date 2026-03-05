import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../auth/LoginPage";
import { AppLayout } from "./layout/AppLayout";
import { IncidentsListPage } from "../features/incidents/IncidentsListPage";
import { IncidentDetailPage } from "../features/incidents/IncidentDetailPage";
import { ProtectedRoute } from "./providers/ProtectedRoute";
import { useAuth } from "./providers/AuthProvider";

/** Redirects to /app/incidents when authed, /login when not. */
function RootRedirect() {
  const { isAuthed } = useAuth();
  return <Navigate to={isAuthed ? "/app/incidents" : "/login"} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="incidents" element={<IncidentsListPage />} />
        <Route path="incidents/:id" element={<IncidentDetailPage />} />
      </Route>

      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}
