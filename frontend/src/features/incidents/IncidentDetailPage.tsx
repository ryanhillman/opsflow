import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getIncident, ackIncident, resolveIncident, changeSeverity } from "./api";
import type { IncidentDto } from "./api";
import { TimelinePanel } from "../timeline/TimelinePanel";
import { SeverityChip, StatusChip } from "../../shared/ui/chips";
import { useToast } from "../../app/providers/ToastProvider";

function DetailSkeleton() {
  return (
    <>
      <section className="card">
        <div className="cardHeader">
          <div className="skeleton" style={{ height: 18, width: "45%", borderRadius: 4 }} />
          <div className="row" style={{ gap: 6, marginTop: 10 }}>
            <div className="skeleton" style={{ height: 18, width: 44, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 4 }} />
          </div>
          <div className="skeleton" style={{ height: 12, width: "30%", borderRadius: 4, marginTop: 10 }} />
        </div>
      </section>

      <section className="card">
        <div className="cardBody" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <div className="skeleton" style={{ height: 32, width: 110, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 32, width: 90, borderRadius: 8 }} />
        </div>
      </section>

      <section className="card">
        <div className="cardBody">
          <div className="skeleton" style={{ height: 14, width: "30%", borderRadius: 4, marginBottom: 14 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 58, borderRadius: 8, marginBottom: 8 }} />
          ))}
        </div>
      </section>
    </>
  );
}

export function IncidentDetailPage() {
  const { id } = useParams();
  const toast = useToast();

  const [item, setItem] = useState<IncidentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ackLoading, setAckLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [sevLoading, setSevLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        setItem(await getIncident(id));
      } catch (e: any) {
        setError(e?.message ?? "Failed to load incident");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  async function runAction(
    fn: () => Promise<void>,
    setLoading: (v: boolean) => void,
    successMsg: string
  ) {
    if (!id) return;
    setLoading(true);
    try {
      await fn();
      setItem(await getIncident(id));
      toast.success(successMsg);
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setLoading(false);
    }
  }

  const actionBtnStyle = (disabled: boolean) => ({
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: disabled ? "var(--bg)" : "#fff",
    color: disabled ? "var(--muted)" : "var(--text)",
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap" as const,
    transition: "transform 0.12s, box-shadow 0.12s",
  });

  return (
    <div className="container" style={{ display: "grid", gap: 16 }}>
      {/* Page header */}
      <div className="row space">
        <div>
          <h1 className="h1">Incident</h1>
          <div className="subtle">{id}</div>
        </div>
        <Link
          to="/app/incidents"
          className="btnGhost"
          style={{ padding: "5px 14px", fontSize: 13 }}
        >
          ← Back
        </Link>
      </div>

      {isLoading ? (
        <DetailSkeleton />
      ) : error ? (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : !item ? (
        <div className="emptyState">
          <div className="emptyIcon">🔍</div>
          <div className="emptyTitle">Incident not found</div>
          <div className="emptySubtitle">It may have been deleted or the ID is incorrect.</div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <section className="card">
            <div className="cardHeader">
              <div style={{ fontWeight: 750, fontSize: 16, lineHeight: 1.3 }}>{item.title}</div>
              <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <SeverityChip severity={item.severity} />
                {item.status && <StatusChip status={item.status} />}
                {item.createdAt && (
                  <span className="subtle" style={{ fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="subtle" style={{ marginTop: 6, fontSize: 12 }}>
                Service: {item.serviceId}
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="card">
            <div
              className="cardBody"
              style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, flexWrap: "wrap" }}
            >
              <button
                style={actionBtnStyle(ackLoading || item.status !== "OPEN")}
                disabled={ackLoading || item.status !== "OPEN"}
                onClick={() => runAction(() => ackIncident(id!), setAckLoading, "Acknowledged")}
              >
                {ackLoading ? "Acknowledging…" : "Acknowledge"}
              </button>

              <button
                style={actionBtnStyle(resolveLoading || item.status === "RESOLVED")}
                disabled={resolveLoading || item.status === "RESOLVED"}
                onClick={() => runAction(() => resolveIncident(id!), setResolveLoading, "Resolved")}
              >
                {resolveLoading ? "Resolving…" : "Resolve"}
              </button>

              <select
                className="select"
                style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}
                disabled={sevLoading}
                value={item.severity}
                onChange={(e) =>
                  runAction(() => changeSeverity(id!, e.target.value), setSevLoading, "Severity updated")
                }
              >
                {["SEV1", "SEV2", "SEV3", "SEV4"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Live Timeline */}
          {id && (
            <section className="card">
              <TimelinePanel incidentId={id} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
