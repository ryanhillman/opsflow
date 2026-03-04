import { useMemo, useState } from "react";
import { useTimelineSse } from "./useTimelineSse";
import { formatEvent } from "./format";

const SYSTEM_TYPES = new Set(["system.connected", "system.heartbeat"]);

const KNOWN_TYPES = new Set([
  "INCIDENT_CREATED",
  "INCIDENT_ACKNOWLEDGED",
  "INCIDENT_SEVERITY_CHANGED",
  "INCIDENT_RESOLVED",
  "timeline.incident.created",
  "timeline.incident.acknowledged",
  "timeline.incident.severity_changed",
  "timeline.incident.resolved",
]);

const SEV_COLORS: Record<string, { bg: string; color: string }> = {
  SEV1: { bg: "#fed7d7", color: "#c53030" },
  SEV2: { bg: "#feebc8", color: "#c05621" },
  SEV3: { bg: "#fefcbf", color: "#975a16" },
  SEV4: { bg: "#bee3f8", color: "#2b6cb0" },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  OPEN:       { bg: "#fed7d7", color: "#c53030" },
  MITIGATING: { bg: "#feebc8", color: "#c05621" },
  RESOLVED:   { bg: "#c6f6d5", color: "#276749" },
};

function Badge({ label, colors }: { label: string; colors: { bg: string; color: string } }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 7px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        background: colors.bg,
        color: colors.color,
      }}
    >
      {label}
    </span>
  );
}

function fmtTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function fmtFull(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export function TimelinePanel({ incidentId }: { incidentId: string }) {
  const { status, error, events } = useTimelineSse({ enabled: true });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (SYSTEM_TYPES.has(e.type)) return false;
        const d: any = e.data ?? {};
        return d.incidentId === incidentId;
      }),
    [events, incidentId]
  );

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ border: "1px solid #e6e6e6", borderRadius: 12, padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div style={{ fontWeight: 650 }}>Timeline (live)</div>
        <div style={{ fontSize: 12, color: status === "open" ? "#38a169" : "#666" }}>
          {status === "open"
            ? "● Live"
            : status === "connecting"
              ? "Connecting…"
              : status}
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 8, color: "crimson", fontSize: 13 }}>{error}</div>
      )}

      {/* Event list */}
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ color: "#777", fontSize: 13 }}>
            No events for this incident yet.
          </div>
        ) : (
          filtered.map((e) => {
            const fmt = formatEvent(e);
            const domainType = (e.data as any)?.type ?? e.type;
            const isUnknown = !KNOWN_TYPES.has(domainType);
            const isExpanded = expanded.has(e.id);
            const sevColors = fmt.severity ? SEV_COLORS[fmt.severity] : null;
            const statusColors = fmt.status ? STATUS_COLORS[fmt.status] : null;

            return (
              <div
                key={e.id}
                style={{
                  border: "1px solid #ebebeb",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: "#fff",
                }}
              >
                {/* Main row: icon+text on left, timestamp on right */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  {/* Icon + content */}
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        color: fmt.iconColor,
                        lineHeight: 1.4,
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    >
                      {fmt.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                        {fmt.title}
                      </div>
                      {fmt.subtitle && (
                        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                          {fmt.subtitle}
                        </div>
                      )}
                      {(sevColors || statusColors) && (
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            marginTop: 5,
                            flexWrap: "wrap",
                          }}
                        >
                          {sevColors && (
                            <Badge label={fmt.severity!} colors={sevColors} />
                          )}
                          {statusColors && (
                            <Badge label={fmt.status!} colors={statusColors} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div
                    style={{
                      fontSize: 12,
                      color: "#888",
                      flexShrink: 0,
                      lineHeight: 1.4,
                      textAlign: "right",
                    }}
                  >
                    <span title={fmtFull(e.ts)}>{fmtTime(e.ts)}</span>
                  </div>
                </div>

                {/* Collapsible raw JSON — only for unknown event types */}
                {isUnknown && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => toggleExpand(e.id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#666",
                        textDecoration: "underline",
                      }}
                    >
                      {isExpanded ? "Hide details" : "Details"}
                    </button>
                    {isExpanded && (
                      <pre
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          background: "#f7f7f7",
                          borderRadius: 6,
                          padding: "8px 10px",
                          overflowX: "auto",
                          color: "#444",
                        }}
                      >
                        {JSON.stringify(e.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
