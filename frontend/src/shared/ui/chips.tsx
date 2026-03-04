type ChipColors = { bg: string; color: string };

const SEV_COLORS: Record<string, ChipColors> = {
  SEV1: { bg: "#fed7d7", color: "#c53030" },
  SEV2: { bg: "#feebc8", color: "#c05621" },
  SEV3: { bg: "#fefcbf", color: "#975a16" },
  SEV4: { bg: "#bee3f8", color: "#2b6cb0" },
};

const STATUS_COLORS: Record<string, ChipColors> = {
  OPEN:       { bg: "#fed7d7", color: "#c53030" },
  MITIGATING: { bg: "#feebc8", color: "#c05621" },
  RESOLVED:   { bg: "#c6f6d5", color: "#276749" },
};

const FALLBACK: ChipColors = { bg: "#f3f4f6", color: "#374151" };

function Chip({ label, colors }: { label: string; colors: ChipColors }) {
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
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function SeverityChip({ severity }: { severity: string }) {
  return <Chip label={severity} colors={SEV_COLORS[severity] ?? FALLBACK} />;
}

export function StatusChip({ status }: { status: string }) {
  return <Chip label={status} colors={STATUS_COLORS[status] ?? FALLBACK} />;
}

/** Convenience: look up colors without rendering (for TimelinePanel's Badge) */
export { SEV_COLORS, STATUS_COLORS };
export type { ChipColors };
