import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createIncident, listIncidents } from "./api";
import type { IncidentDto } from "./api";

const DEV_ORG_ID = "00000000-0000-0000-0000-000000000001";

export function IncidentsListPage() {
  const nav = useNavigate();

  const [items, setItems] = useState<IncidentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For now, we’ll ask for serviceId manually unless you already have a service selector.
  const [serviceId, setServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"SEV1" | "SEV2" | "SEV3" | "SEV4">("SEV3");
  const [isCreating, setIsCreating] = useState(false);

  const canCreate = useMemo(() => {
    return serviceId.trim().length > 0 && title.trim().length > 0 && !isCreating;
  }, [serviceId, title, isCreating]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listIncidents();
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load incidents");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;

    setIsCreating(true);
    setError(null);
    try {
      const res = await createIncident({ serviceId, title, severity });
      setTitle("");

      // reload list (simple + consistent)
      await load();

      // navigate to detail (SaaS feel)
      nav(`/app/incidents/${res.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create incident");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1>Incidents</h1>
        <p style={{ color: "#555" }}>Org: {DEV_ORG_ID} (org switcher later)</p>
      </div>

      <section style={{ border: "1px solid #e6e6e6", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Create incident</h2>

        <form onSubmit={onCreate} style={{ display: "grid", gap: 12, maxWidth: 820 }}>
          <label>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Service ID</div>
            <input
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="UUID of a service"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />
          </label>

          <label>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="API latency spike"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />
          </label>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
            <label>
              <div style={{ fontSize: 12, marginBottom: 6 }}>Severity</div>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
              >
                <option value="SEV1">SEV1</option>
                <option value="SEV2">SEV2</option>
                <option value="SEV3">SEV3</option>
                <option value="SEV4">SEV4</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={!canCreate}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #222",
                background: !canCreate ? "#f2f2f2" : "#222",
                color: !canCreate ? "#222" : "white",
                cursor: !canCreate ? "default" : "pointer",
              }}
            >
              {isCreating ? "Creating..." : "Create"}
            </button>

            <button
              type="button"
              onClick={load}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "white",
              }}
            >
              Refresh
            </button>
          </div>
        </form>

        {error && <div style={{ marginTop: 10, color: "crimson", fontSize: 13 }}>{error}</div>}
      </section>

      <section style={{ border: "1px solid #e6e6e6", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Recent incidents</h2>

        {isLoading ? (
          <div>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ color: "#666" }}>No incidents yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((i) => (
              <Link
                key={i.id}
                to={`/app/incidents/${i.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 650 }}>{i.title}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    {i.severity} {i.status ? `• ${i.status}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>{i.id}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
