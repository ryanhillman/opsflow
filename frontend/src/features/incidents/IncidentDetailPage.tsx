import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getIncident, ackIncident, resolveIncident, changeSeverity } from "./api";
import type { IncidentDto } from "./api";
import { TimelinePanel } from "../timeline/TimelinePanel";

function actionBtn(disabled: boolean): CSSProperties {
  return {
    padding: "5px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: disabled ? "#f9f9f9" : "#fff",
    color: disabled ? "#aaa" : "#374151",
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    lineHeight: 1.5,
    whiteSpace: "nowrap",
  };
}

export function IncidentDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<IncidentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ackLoading, setAckLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [sevLoading, setSevLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getIncident(id);
        setItem(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load incident");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  async function runAction(fn: () => Promise<void>, setLoading: (v: boolean) => void) {
    if (!id) return;
    setLoading(true);
    setActionError(null);
    try {
      await fn();
      const updated = await getIncident(id);
      setItem(updated);
    } catch (e: any) {
      setActionError(e?.message ?? "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ marginBottom: 6 }}>Incident</h1>
          <div style={{ fontSize: 12, color: "#666" }}>{id}</div>
        </div>

        <Link to="/app/incidents">← Back</Link>
      </div>

      {isLoading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : !item ? (
        <div>Not found</div>
      ) : (
        <>
          {/* Incident Summary */}
          <div
            style={{
              border: "1px solid #e6e6e6",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 750, fontSize: 18 }}>{item.title}</div>

            <div style={{ marginTop: 8, color: "#555" }}>
              {item.severity}
              {item.status ? ` • ${item.status}` : ""}
              {" • Service "}
              {item.serviceId}
            </div>

            {item.createdAt && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                {item.createdAt}
              </div>
            )}
          </div>

          {/* Actions row */}
          <div
            style={{
              border: "1px solid #e6e6e6",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {actionError && (
              <span
                style={{ fontSize: 12, color: "crimson", marginRight: "auto" }}
              >
                {actionError}
              </span>
            )}

            <button
              style={actionBtn(ackLoading || item.status !== "OPEN")}
              disabled={ackLoading || item.status !== "OPEN"}
              onClick={() => runAction(() => ackIncident(id!), setAckLoading)}
            >
              {ackLoading ? "Acknowledging…" : "Acknowledge"}
            </button>

            <button
              style={actionBtn(resolveLoading || item.status === "RESOLVED")}
              disabled={resolveLoading || item.status === "RESOLVED"}
              onClick={() =>
                runAction(() => resolveIncident(id!), setResolveLoading)
              }
            >
              {resolveLoading ? "Resolving…" : "Resolve"}
            </button>

            <select
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: sevLoading ? "#f9f9f9" : "#fff",
                color: sevLoading ? "#aaa" : "#374151",
                fontSize: 13,
                cursor: sevLoading ? "not-allowed" : "pointer",
              }}
              disabled={sevLoading}
              value={item.severity}
              onChange={(e) =>
                runAction(() => changeSeverity(id!, e.target.value), setSevLoading)
              }
            >
              {["SEV1", "SEV2", "SEV3", "SEV4"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Live Timeline */}
          {id && <TimelinePanel incidentId={id} />}
        </>
      )}
    </div>
  );
}
