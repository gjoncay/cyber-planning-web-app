"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { ShieldAlert, Network, Server, Lock, Eye, Ghost } from "lucide-react";
import { useBriefingStore } from "@/store/useBriefingStore";

const DANGER = "#ef4444";

const TIER_CONFIG: Record<string, { color: string; icon: typeof Eye }> = {
  observation: { color: "var(--color-observation)", icon: Eye },
  "avenue-of-approach": { color: "var(--color-avenue)", icon: Network },
  obstacle: { color: "var(--color-obstacle)", icon: ShieldAlert },
  "key-terrain": { color: "var(--color-key-terrain)", icon: Server },
  "cover-concealment": { color: "var(--color-cover)", icon: Lock },
};

const getTierConfig = (tier: string) =>
  TIER_CONFIG[tier] ?? { color: "var(--text-secondary)", icon: Network };

const formatExposure = (value: number) =>
  value >= 1e6 ? `$${(value / 1e6).toFixed(1)}M` : `$${(value / 1000).toFixed(0)}k`;

const epssColor = (epss: number) =>
  epss >= 0.8 ? DANGER : epss >= 0.4 ? "var(--accent-secondary)" : "var(--accent-primary)";

export function OAKOCNode({ data, selected }: NodeProps) {
  const { viewMode } = useBriefingStore();

  const isKev = data.cves?.some((cve: string) => data.metrics?.[cve]?.isExploited);
  const financialRisk = data.financialRisk || 0;

  let maxEpss = 0;
  if (data.cves && data.metrics) {
    data.cves.forEach((cve: string) => {
      const metric = data.metrics?.[cve];
      if (metric && metric.epssPercentile > maxEpss) {
        maxEpss = metric.epssPercentile;
      }
    });
  }
  const isHighRisk = isKev || maxEpss >= 0.8;
  const hasCves = (data.cves?.length ?? 0) > 0;

  const { color: tierColor, icon: Icon } = getTierConfig(data.tier);

  return (
    <div
      className={`relative min-w-[200px] max-w-[260px] bg-[var(--bg-surface)] rounded-lg shadow-card overflow-hidden border transition-colors ${
        selected
          ? "border-[var(--accent-primary)] bg-[var(--accent-glow)]"
          : "border-[var(--border-default)]"
      }`}
      style={isHighRisk && !selected ? { borderColor: `${DANGER}66` } : undefined}
    >
      {/* Left accent spine (tier identity) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
        style={{ background: tierColor }}
      />

      {/* Threat Actor Badge (future actor-dashboard seam) */}
      {data.threatActor && (
        <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-raised)] border border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
          <Ghost className="h-2.5 w-2.5" />
          {data.threatActor}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-[var(--border-strong)] border-none"
      />

      {/* Header */}
      <div className="pl-4 pr-3 pt-2.5 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: tierColor }} />
          <span
            className="font-bold text-[12px] text-[var(--text-primary)] truncate"
            title={data.name}
          >
            {data.name}
          </span>
          {isHighRisk && (
            <span
              className="ml-auto shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border"
              style={{
                color: DANGER,
                backgroundColor: `${DANGER}1a`,
                borderColor: `${DANGER}40`,
              }}
            >
              {isKev ? "KEV" : "HIGH"}
            </span>
          )}
        </div>
        <span className="data-label block mt-1">{data.tier.replace(/-/g, " ")}</span>
      </div>

      {/* Body */}
      <div className="pl-4 pr-3 pb-3 flex flex-col gap-1.5 border-t border-[var(--border-subtle)] pt-2">
        {viewMode === "tactical" ? (
          <>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-[var(--text-muted)] data-label">Tier</span>
              <span className="font-semibold" style={{ color: tierColor }}>
                {data.tier.replace(/-/g, " ")}
              </span>
            </div>

            {data.ips?.length > 0 && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[var(--text-muted)] data-label">IP</span>
                <span className="mono text-[var(--text-secondary)]">{data.ips[0]}</span>
              </div>
            )}

            {hasCves && (
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {data.cves.slice(0, 3).map((cve: string) => (
                  <span
                    key={cve}
                    className="mono text-[10px] bg-[var(--bg-raised)] border border-[var(--border-default)] rounded px-1 text-[var(--text-secondary)]"
                  >
                    {cve}
                  </span>
                ))}
                {data.cves.length > 3 && (
                  <span className="mono text-[10px] text-[var(--text-muted)]">
                    +{data.cves.length - 3}
                  </span>
                )}
                {isKev && (
                  <span
                    className="px-1 rounded text-[9px] font-bold border"
                    style={{
                      color: DANGER,
                      backgroundColor: `${DANGER}1a`,
                      borderColor: `${DANGER}40`,
                    }}
                  >
                    KEV
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-[var(--text-muted)] data-label">Exposure</span>
              <span className="mono font-bold text-[var(--accent-primary)] tabular-nums">
                {formatExposure(financialRisk)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-[var(--text-muted)] data-label">Max EPSS</span>
              <span
                className="mono font-bold tabular-nums"
                style={{ color: epssColor(maxEpss) }}
              >
                {Math.round(maxEpss * 100)}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Ranked EPSS bar */}
      {hasCves && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[var(--bg-raised)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.round(maxEpss * 100)}%`,
              background: epssColor(maxEpss),
            }}
            title={`Max EPSS Likelihood: ${Math.round(maxEpss * 100)}%`}
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-[var(--border-strong)] border-none"
      />
    </div>
  );
}
