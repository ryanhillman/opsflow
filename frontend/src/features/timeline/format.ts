import type { SseEnvelopeV1 } from "./useTimelineSse";

export type FormattedEvent = {
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  severity?: string;
  status?: string;
};

export function formatEvent(env: SseEnvelopeV1): FormattedEvent {
  const data: any = env?.data ?? {};
  const domainType: string = data.type ?? env.type;

  switch (domainType) {
    case "INCIDENT_CREATED":
    case "timeline.incident.created":
      return {
        icon: "●",
        iconColor: "#e53e3e",
        title: data.title ? `Incident created: ${data.title}` : "Incident created",
        severity: data.severity,
        status: data.status,
      };

    case "INCIDENT_ACKNOWLEDGED":
    case "timeline.incident.acknowledged":
      return {
        icon: "◉",
        iconColor: "#dd6b20",
        title: "Incident acknowledged",
        subtitle:
          data.previousStatus && data.status
            ? `${data.previousStatus} → ${data.status}`
            : undefined,
        status: data.status,
      };

    case "INCIDENT_SEVERITY_CHANGED":
    case "timeline.incident.severity_changed":
      return {
        icon: "▲",
        iconColor: "#805ad5",
        title: "Severity changed",
        subtitle:
          data.previousSeverity && data.severity
            ? `${data.previousSeverity} → ${data.severity}`
            : undefined,
        severity: data.severity,
      };

    case "INCIDENT_RESOLVED":
    case "timeline.incident.resolved":
      return {
        icon: "✓",
        iconColor: "#38a169",
        title: "Incident resolved",
        subtitle:
          data.previousStatus && data.status
            ? `${data.previousStatus} → ${data.status}`
            : undefined,
        status: data.status,
      };

    default:
      return {
        icon: "?",
        iconColor: "#718096",
        title: domainType ?? "Timeline event",
      };
  }
}
