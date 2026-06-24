import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

type Indicator = "none" | "minor" | "major" | "critical" | "unknown";
type ComponentStatus = "operational" | "degraded_performance" | "partial_outage" | "major_outage" | "under_maintenance" | string;

interface StatusData {
  indicator: Indicator;
  description: string;
  components: { name: string; status: ComponentStatus }[];
  incidents: { name: string; status: string; body: string }[];
}

const INDICATOR_COLOR: Record<string, string> = {
  none: "#3ecf8e",
  minor: "#f0c040",
  major: "#f0a850",
  critical: "#ff6b6b",
  unknown: "#6a6a6e",
};

const COMPONENT_COLOR: Record<string, string> = {
  operational: "#3ecf8e",
  degraded_performance: "#f0c040",
  partial_outage: "#f0a850",
  major_outage: "#ff6b6b",
  under_maintenance: "#7a9abf",
};

const COMPONENT_LABEL: Record<string, string> = {
  operational: "Operational",
  degraded_performance: "Degraded",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  under_maintenance: "Maintenance",
};

const INCIDENT_STATUS_LABEL: Record<string, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

function StatusDot({ status, pulse }: { status: string; pulse?: boolean }) {
  const color = COMPONENT_COLOR[status] ?? "#6a6a6e";
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}99`,
        flexShrink: 0,
        display: "inline-block",
        animation: pulse ? "pulse-dot 2s ease-in-out infinite" : undefined,
      }}
    />
  );
}

export function ClaudeStatus() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await api.getClaudeStatus();
      setData(s as StatusData);
    } catch {
      setData({
        indicator: "unknown",
        description: "Could not reach status page",
        components: [],
        incidents: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const indicator = data?.indicator ?? "unknown";
  const overallColor = INDICATOR_COLOR[indicator] ?? INDICATOR_COLOR.unknown;
  const isOk = indicator === "none";
  const hasIncident = (data?.incidents?.length ?? 0) > 0;

  return (
    <div style={{ padding: "0 16px 14px" }}>
      {/* Section header — clickable to expand/collapse */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 0 10px",
          color: "inherit",
        }}
      >
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.7px", color: "#7a7a7e" }}>
          CLAUDE STATUS
        </span>
        <div style={{ flex: 1 }} />
        {loading ? (
          <span style={{ fontSize: 11, color: "#6a6a6e" }}>Checking…</span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: overallColor,
              background: `${overallColor}18`,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            <StatusDot status={indicator === "none" ? "operational" : "major_outage"} pulse={!isOk} />
            {data?.description ?? "Unknown"}
          </span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6a6a6e"
          strokeWidth="2.5"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0, marginLeft: 4 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expandable card */}
      {expanded && (
        <div
          style={{
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Incident banner */}
          {hasIncident && data!.incidents.map((inc, i) => (
            <div
              key={i}
              style={{
                padding: "10px 14px",
                background: "rgba(255,107,107,0.12)",
                borderBottom: "1px solid rgba(255,107,107,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#ff6b6b" }}>
                  ⚠ {inc.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#f0a850",
                    background: "rgba(240,168,80,0.15)",
                    padding: "1px 6px",
                    borderRadius: 10,
                    textTransform: "capitalize",
                  }}
                >
                  {INCIDENT_STATUS_LABEL[inc.status] ?? inc.status}
                </span>
                {inc.body && (
                  <span style={{ fontSize: 10.5, color: "#9a9a9e", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inc.body}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Component rows */}
          {loading ? (
            <div style={{ padding: "12px 14px", fontSize: 12, color: "#6a6a6e" }}>Loading…</div>
          ) : data?.components.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 12, color: "#6a6a6e" }}>No component data</div>
          ) : (
            data!.components.map((comp, i) => {
              const color = COMPONENT_COLOR[comp.status] ?? "#6a6a6e";
              const label = COMPONENT_LABEL[comp.status] ?? comp.status;
              const isLast = i === data!.components.length - 1;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <StatusDot status={comp.status} pulse={comp.status !== "operational"} />
                  <span style={{ fontSize: 12.5, color: "#d0d0d4", flex: 1 }}>{comp.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })
          )}

          {/* Footer link */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "8px 14px",
              background: "rgba(255,255,255,0.02)",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span style={{ fontSize: 10, color: "#5a5a5e" }}>
              status.claude.com · refreshes every 5m
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
