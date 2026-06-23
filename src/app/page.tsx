"use client";

import { useEffect, useState, useMemo } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import Header from "@/components/Header";
import BriefingLayout from "@/components/BriefingLayout";
import { RefreshCw } from "lucide-react";

const TIER_TALLY = [
  { tier: "observation", label: "Obs", color: "var(--color-observation)" },
  { tier: "avenue-of-approach", label: "Avenue", color: "var(--color-avenue)" },
  { tier: "obstacle", label: "Obstacle", color: "var(--color-obstacle)" },
  { tier: "key-terrain", label: "Key", color: "var(--color-key-terrain)" },
  { tier: "cover-concealment", label: "Cover", color: "var(--color-cover)" },
] as const;

function formatExposure(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${Math.round(value / 1e3)}k`;
  return `$${value}`;
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const { nodes, viewMode } = useBriefingStore();

  useEffect(() => {
    useBriefingStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const stats = useMemo(() => {
    const uniqueCves = new Set<string>();
    const uniqueKevs = new Set<string>();
    const tierCounts: Record<string, number> = {
      observation: 0,
      "avenue-of-approach": 0,
      obstacle: 0,
      "key-terrain": 0,
      "cover-concealment": 0,
    };
    let exposure = 0;

    for (const node of nodes) {
      tierCounts[node.data.tier] = (tierCounts[node.data.tier] ?? 0) + 1;
      exposure += node.data.financialRisk ?? 0;
      if (node.data.cves) {
        node.data.cves.forEach((cve: string) => {
          uniqueCves.add(cve);
          if (node.data.metrics && node.data.metrics[cve] && node.data.metrics[cve].isExploited) {
            uniqueKevs.add(cve);
          }
        });
      }
    }

    return {
      tierCounts,
      cveCount: uniqueCves.size,
      kevCount: uniqueKevs.size,
      exposure,
    };
  }, [nodes]);

  if (!hydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-base)]">
        <RefreshCw className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] font-sans">
      <Header />

      <main className="flex-1 overflow-y-auto min-h-0 min-w-0">
        <div className="w-full h-full p-4 md:p-6 flex flex-col">
          {/* Terrain Summary Strip */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-card px-5 py-4 mb-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="data-label">Operations Briefing</span>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">OAKOC Terrain Model</h1>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Defense-in-depth cross-section — map terrain, track exposure, brief the threat.
              </p>
            </div>

            <div className="flex items-center gap-5 flex-wrap">
              {/* Tier tally chips */}
              <div className="flex items-center gap-3">
                {TIER_TALLY.map(({ tier, label, color }) => (
                  <div key={tier} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-[2px]"
                      style={{ background: color }}
                    />
                    <span className="text-[10px] text-[var(--text-secondary)]">{label}</span>
                    <span className="text-[12px] font-bold tabular-nums text-[var(--text-primary)]">
                      {stats.tierCounts[tier] ?? 0}
                    </span>
                  </div>
                ))}
              </div>

              <div className="w-px h-8 bg-[var(--border-default)]" />

              {/* Readouts */}
              <div className="flex items-center gap-5">
                <div className="flex flex-col">
                  <span className="data-label">Exposure</span>
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      viewMode === "strategic"
                        ? "text-[var(--accent-primary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {formatExposure(stats.exposure)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="data-label">Active KEV</span>
                  <span className="flex items-baseline gap-1">
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        viewMode === "tactical"
                          ? "text-[var(--accent-primary)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {stats.kevCount}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">/ {stats.cveCount} CVE</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollytelling & Visual Scaffolding Grid */}
          <div className="flex-1 flex flex-col min-h-[600px] pb-4">
            <BriefingLayout />
          </div>
        </div>
      </main>
    </div>
  );
}
