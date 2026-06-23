"use client";

import { useEffect, useState, useMemo } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { TIER_ORDER, TIER_META } from "@/lib/oakoc";
import Header from "@/components/Header";
import BriefingLayout from "@/components/BriefingLayout";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const { elements } = useBriefingStore();

  useEffect(() => {
    useBriefingStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const stats = useMemo(() => {
    const cves = new Set<string>();
    const kevs = new Set<string>();
    const tierCounts: Record<string, number> = {};
    for (const el of elements) {
      tierCounts[el.tier] = (tierCounts[el.tier] ?? 0) + 1;
      for (const cve of el.cves) {
        cves.add(cve);
        if (el.metrics?.[cve]?.isExploited) kevs.add(cve);
      }
    }
    return { tierCounts, cveCount: cves.size, kevCount: kevs.size, total: elements.length };
  }, [elements]);

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

      {/* Summary strip — the at-a-glance terrain tally (no cost/exposure) */}
      <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {TIER_ORDER.map((tier) => {
            const meta = TIER_META[tier];
            return (
              <div key={tier} className="flex items-center gap-1.5" title={meta.name}>
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: meta.color }} />
                <span className="text-[11px] text-[var(--text-secondary)]">{meta.short}</span>
                <span className="text-[12px] font-bold tabular-nums text-[var(--text-primary)]">
                  {stats.tierCounts[tier] ?? 0}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="data-label" style={{ color: "var(--accent-secondary)" }}>
              Elements
            </span>
            <span className="text-[13px] font-bold tabular-nums text-[var(--accent-primary)]">
              {stats.total}
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Assigned CVEs that are actively exploited (CISA KEV)">
            <ShieldAlert
              className="h-3.5 w-3.5"
              style={{ color: stats.kevCount > 0 ? "#ef4444" : "var(--text-muted)" }}
            />
            <span className="data-label">Exploited</span>
            <span className="flex items-baseline gap-1">
              <span
                className="text-[13px] font-bold tabular-nums"
                style={{ color: stats.kevCount > 0 ? "#ef4444" : "var(--text-primary)" }}
              >
                {stats.kevCount}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">/ {stats.cveCount} CVE</span>
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto min-h-0 min-w-0">
        <div className="px-4 md:px-6 py-6">
          <BriefingLayout />
        </div>
      </main>
    </div>
  );
}
