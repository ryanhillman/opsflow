import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createIncident, listIncidents } from "./api";
import type { IncidentDto } from "./api";
import { listServices } from "../services/api";
import type { ServiceDto } from "../services/api";
import { SeverityChip, StatusChip } from "../../shared/ui/chips";
import { useToast } from "../../app/providers/ToastProvider";

const DEV_ORG_ID = "00000000-0000-0000-0000-000000000001";

function parseTs(iso?: string) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

function formatRelativeTime(iso?: string) {
  const ts = parseTs(iso);
  if (!ts) return null;

  const deltaMs = ts - Date.now();
  const abs = Math.abs(deltaMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (abs < hour) return rtf.format(Math.round(deltaMs / minute), "minute");
  if (abs < day)  return rtf.format(Math.round(deltaMs / hour),   "hour");
  return rtf.format(Math.round(deltaMs / day), "day");
}

type FilterKey = "active" | "resolved" | "all";
const ACTIVE_STATUSES = new Set(["OPEN", "MITIGATING"]);

function IncidentRowSkeleton() {
  return (
    <div className="card" style={{ boxShadow: "none", padding: "12px 14px" }}>
      <div className="row space" style={{ alignItems: "flex-start" }}>
        <div className="skeleton" style={{ height: 15, width: "38%", borderRadius: 4 }} />
        <div className="row" style={{ gap: 6 }}>
          <div className="skeleton" style={{ height: 18, width: 44, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 18, width: 58, borderRadius: 4 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 12, width: "55%", borderRadius: 4, marginTop: 9 }} />
    </div>
  );
}

const EMPTY_COPY: Record<FilterKey, { icon: string; title: string; sub: string }> = {
  active:   { icon: "✨", title: "No active incidents", sub: "All clear — nothing open or mitigating right now." },
  resolved: { icon: "📋", title: "No resolved incidents", sub: "Resolved incidents will appear here." },
  all:      { icon: "📟", title: "No incidents yet", sub: "Create your first incident to get started." },
};

export function IncidentsListPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState<IncidentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("active");

  const [services, setServices] = useState<ServiceDto[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"SEV1" | "SEV2" | "SEV3" | "SEV4">("SEV3");
  const [isCreating, setIsCreating] = useState(false);

  const canCreate = useMemo(
    () => serviceId.trim().length > 0 && title.trim().length > 0 && !isCreating,
    [serviceId, title, isCreating]
  );

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = parseTs(a.createdAt);
      const tb = parseTs(b.createdAt);
      if (ta == null && tb == null) return 0;
      if (ta == null) return 1;
      if (tb == null) return -1;
      return tb - ta;
    });
  }, [items]);

  const counts = useMemo(() => ({
    active:   sortedItems.filter((i) => ACTIVE_STATUSES.has(i.status ?? "")).length,
    resolved: sortedItems.filter((i) => i.status === "RESOLVED").length,
    all:      sortedItems.length,
  }), [sortedItems]);

  const visibleItems = useMemo(() => {
    if (filter === "active")   return sortedItems.filter((i) => ACTIVE_STATUSES.has(i.status ?? ""));
    if (filter === "resolved") return sortedItems.filter((i) => i.status === "RESOLVED");
    return sortedItems;
  }, [sortedItems, filter]);

  async function load() {
    setIsLoading(true);
    try {
      const data = await listIncidents();
      setItems(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load incidents");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    listServices()
      .then((svcs) => {
        setServices(svcs);
        if (svcs.length > 0) setServiceId(svcs[0].id);
      })
      .catch(() => {/* non-fatal */});
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    setIsCreating(true);
    try {
      const res = await createIncident({ serviceId, title, severity });
      setTitle("");
      toast.success("Incident created");
      await load();
      nav(`/app/incidents/${res.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create incident");
    } finally {
      setIsCreating(false);
    }
  }

  const empty = EMPTY_COPY[filter];

  return (
    <div className="container" style={{ display: "grid", gap: 18 }}>
      <div className="row space">
        <div>
          <h1 className="h1">Incidents</h1>
          <div className="subtle">Org: {DEV_ORG_ID}</div>
        </div>
        <button type="button" className="btnGhost" onClick={load} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {/* Create form */}
      <section className="card">
        <div className="cardHeader">
          <div style={{ fontWeight: 750 }}>Create incident</div>
          <div className="subtle">Open a new incident for a service.</div>
        </div>

        <div className="cardBody">
          <form onSubmit={onCreate} style={{ display: "grid", gap: 12, maxWidth: 820 }}>
            <label>
              <div className="subtle" style={{ marginBottom: 6 }}>Service</div>
              <select
                className="select"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={services.length === 0}
              >
                {services.length === 0 && <option value="">Loading services…</option>}
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <label>
              <div className="subtle" style={{ marginBottom: 6 }}>Title</div>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="API latency spike"
              />
            </label>

            <div className="row" style={{ flexWrap: "wrap", alignItems: "end" }}>
              <label style={{ minWidth: 160 }}>
                <div className="subtle" style={{ marginBottom: 6 }}>Severity</div>
                <select
                  className="select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                >
                  <option value="SEV1">SEV1</option>
                  <option value="SEV2">SEV2</option>
                  <option value="SEV3">SEV3</option>
                  <option value="SEV4">SEV4</option>
                </select>
              </label>

              <button type="submit" className="btn" disabled={!canCreate} style={{ minWidth: 120 }}>
                {isCreating ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Incidents list */}
      <section className="card">
        <div
          className="cardHeader"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}
        >
          <div style={{ fontWeight: 750 }}>Recent incidents</div>

          <div className="row" style={{ gap: 4 }}>
            {(["active", "resolved", "all"] as FilterKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={filter === key ? "btn" : "btnGhost"}
                style={{ padding: "5px 12px", fontSize: 13, fontWeight: 600 }}
                onClick={() => setFilter(key)}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
                <span
                  style={{
                    marginLeft: 6,
                    padding: "1px 6px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: filter === key ? "rgba(255,255,255,0.2)" : "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="cardBody">
          {isLoading ? (
            <div style={{ display: "grid", gap: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => <IncidentRowSkeleton key={i} />)}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">{empty.icon}</div>
              <div className="emptyTitle">{empty.title}</div>
              <div className="emptySubtitle">{empty.sub}</div>
              {filter === "all" && (
                <button
                  type="button"
                  className="btnGhost"
                  style={{ marginTop: 12, padding: "6px 16px", fontSize: 13 }}
                  onClick={() => document.querySelector<HTMLInputElement>(".input")?.focus()}
                >
                  Create incident ↑
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {visibleItems.map((i) => {
                const rel  = formatRelativeTime(i.createdAt);
                const full = i.createdAt ? new Date(i.createdAt).toLocaleString() : null;

                return (
                  <Link
                    key={i.id}
                    to={`/app/incidents/${i.id}`}
                    className="card cardLink"
                    style={{ boxShadow: "none", padding: "12px 14px", display: "block" }}
                  >
                    <div className="row space" style={{ alignItems: "flex-start" }}>
                      <div style={{ fontWeight: 650 }}>{i.title}</div>

                      <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                        <SeverityChip severity={i.severity} />
                        {i.status && <StatusChip status={i.status} />}
                        {rel && (
                          <span className="badge" title={full ?? undefined}>{rel}</span>
                        )}
                      </div>
                    </div>

                    <div className="subtle" style={{ marginTop: 5, fontSize: 12 }}>{i.id}</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
