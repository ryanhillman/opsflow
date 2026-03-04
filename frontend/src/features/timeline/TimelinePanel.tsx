import { useMemo } from "react";
import { useTimelineSse } from "./useTimelineSse";

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export function TimelinePanel({ incidentId }: { incidentId: string }) {
  const { status, error, events } = useTimelineSse({ enabled: true });

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const d: any = e.data ?? {};
      return d.incidentId === incidentId;
    });
  }, [events, incidentId]);

  return (
    <div style={{ border: "1px solid #e6e6e6", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 650 }}>Timeline (live)</div>
        <div style={{ fontSize: 12, color: "#666" }}>
          {status === "open" ? "Live" : status === "connecting" ? "Connecting…" : status}
        </div>
      </div>

      {error && <div style={{ marginTop: 8, color: "crimson", fontSize: 13 }}>{error}</div>}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ color: "#777", fontSize: 13 }}>No events for this incident yet.</div>
        ) : (
          filtered.map((e) => (
            <div key={e.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 600 }}>{e.type}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{fmt(e.ts)}</div>
              </div>
              <pre style={{ marginTop: 8, fontSize: 12, overflowX: "auto" }}>
                {JSON.stringify(e.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}