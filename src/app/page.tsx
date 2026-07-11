"use client";

import { useEffect, useState, useMemo } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { useScenarioStore } from "@/store/useScenarioStore";
import { TIER_ORDER, TIER_META } from "@/lib/oakoc";
import Header from "@/components/Header";
import BriefingLayout from "@/components/BriefingLayout";
import GuideView from "@/components/GuideView";
import UndoToast from "@/components/UndoToast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ShieldAlert } from "lucide-react";
import { AboutDialog } from "@/components/AboutDialog";

/** Pre-hydration stand-in mirroring the header + summary strip geometry so
    the persisted state can load without a full-screen spinner layout shift. */
function HydrationSkeleton() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-base)]" aria-busy>
      {/* Header bar */}
      <div className="h-14 shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-[var(--bg-raised)] animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-32 rounded bg-[var(--bg-raised)] animate-pulse" />
            <div className="h-2.5 w-24 rounded bg-[var(--bg-raised)] animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-44 rounded-md bg-[var(--bg-raised)] animate-pulse" />
          <div className="h-7 w-20 rounded-md bg-[var(--bg-raised)] animate-pulse" />
          <div className="h-7 w-7 rounded-md bg-[var(--bg-raised)] animate-pulse" />
        </div>
      </div>
      {/* Summary strip */}
      <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {TIER_ORDER.map((tier) => (
            <div key={tier} className="h-4 w-20 rounded bg-[var(--bg-raised)] animate-pulse" />
          ))}
        </div>
        <div className="flex items-center gap-5">
          <div className="h-4 w-20 rounded bg-[var(--bg-raised)] animate-pulse" />
          <div className="h-4 w-28 rounded bg-[var(--bg-raised)] animate-pulse" />
        </div>
      </div>
      {/* Content placeholder */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-4">
        <div className="h-24 rounded-xl bg-[var(--bg-raised)] animate-pulse" />
        <div className="h-24 rounded-xl bg-[var(--bg-raised)] animate-pulse opacity-70" />
        <div className="h-24 rounded-xl bg-[var(--bg-raised)] animate-pulse opacity-40" />
      </div>
    </div>
  );
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { elements, mode } = useBriefingStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wait for the persisted state to actually load before rendering.
      await Promise.all([useBriefingStore.persist.rehydrate(), useScenarioStore.persist.rehydrate()]);
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
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
    return <HydrationSkeleton />;
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
            <span className="data-label">
              Elements
            </span>
            <span className="text-[13px] font-bold tabular-nums text-[var(--accent-primary)]">
              {stats.total}
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Assigned CVEs that are actively exploited (CISA KEV)">
            <ShieldAlert
              className="h-3.5 w-3.5"
              style={{ color: stats.kevCount > 0 ? "var(--accent-negative)" : "var(--text-muted)" }}
            />
            <span className="data-label">Exploited</span>
            <span className="flex items-baseline gap-1">
              <span
                className="text-[13px] font-bold tabular-nums"
                style={{ color: stats.kevCount > 0 ? "var(--accent-negative)" : "var(--text-primary)" }}
              >
                {stats.kevCount}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">/ {stats.cveCount} CVE</span>
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto min-h-0 min-w-0">
        <div className="px-4 md:px-6 py-6 flex-1">
          <ErrorBoundary>
            {mode === "guide" ? <GuideView /> : <BriefingLayout />}
          </ErrorBoundary>
        </div>
        {/* Footer */}
        <div className="shrink-0 px-6 py-3 border-t border-[var(--border-default)] flex items-center justify-between mt-auto">
           <button onClick={() => setAboutOpen(true)} className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">About &amp; legal</button>
           <span className="text-[10px] text-[var(--text-muted)]">Data: MITRE ATT&amp;CK® · D3FEND™</span>
        </div>
      </main>
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <UndoToast />
    </div>
  );
}
