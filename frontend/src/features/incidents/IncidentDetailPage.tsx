import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getIncident } from "./api";
import type { IncidentDto } from "./api";
import { TimelinePanel } from "../timeline/TimelinePanel";

export function IncidentDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<IncidentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={{ display: "grid", gap: 16 }}>
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
            <div style={{ fontWeight: 750, fontSize: 18 }}>
              {item.title}
            </div>

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

          {/* Live Timeline */}
          {id && <TimelinePanel incidentId={id} />}
        </>
      )}
    </div>
  );
}