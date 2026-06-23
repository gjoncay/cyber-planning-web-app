"use client";

import { useEffect, useRef, useState } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { searchGroups, fetchGroupTechniques } from "@/lib/api";
import { AttackGroup, AttackTechnique, TACTIC_NAMES, tacticForTechnique, TACTIC_TO_TIER } from "@/lib/attack";
import { TIER_META, TIER_GROUPS } from "@/lib/oakoc";
import { PlanElement, ThreatTier } from "@/types";
import { X, Search, RefreshCw, Users, ArrowLeft, DownloadCloud } from "lucide-react";

interface ImportAdversaryProps {
  onClose: () => void;
}

/** One importable OAKOC element = an ATT&CK tactic's techniques for this group. */
interface TacticBucket {
  tactic: string;
  tier: ThreatTier;
  name: string;
  techniques: AttackTechnique[];
}

function bucketByTactic(group: AttackGroup, techniques: AttackTechnique[]): TacticBucket[] {
  const map = new Map<string, AttackTechnique[]>();
  for (const t of techniques) {
    const tactic = tacticForTechnique(t);
    (map.get(tactic) ?? map.set(tactic, []).get(tactic)!).push(t);
  }
  return [...map.entries()]
    .map(([tactic, techs]) => ({
      tactic,
      tier: TACTIC_TO_TIER[tactic] ?? "avenue-of-approach",
      name: TACTIC_NAMES[tactic] ?? tactic,
      techniques: techs.sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function ImportAdversary({ onClose }: ImportAdversaryProps) {
  const upsertElements = useBriefingStore((s) => s.upsertElements);
  const setMode = useBriefingStore((s) => s.setMode);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AttackGroup[]>([]);
  const [searching, setSearching] = useState(false);

  const [group, setGroup] = useState<AttackGroup | null>(null);
  const [buckets, setBuckets] = useState<TacticBucket[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    queryRef.current = q;
    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchGroups(q);
      if (queryRef.current !== q) return;
      setResults(r);
      setSearching(false);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const selectGroup = async (g: AttackGroup) => {
    setLoadingGroup(true);
    setGroup(g);
    const data = await fetchGroupTechniques(g.id);
    setBuckets(data ? bucketByTactic(g, data.techniques) : []);
    setExcluded(new Set());
    setLoadingGroup(false);
  };

  const reset = () => {
    setGroup(null);
    setBuckets([]);
    setExcluded(new Set());
  };

  const toggle = (tactic: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(tactic) ? next.delete(tactic) : next.add(tactic);
      return next;
    });

  const included = buckets.filter((b) => !excluded.has(b.tactic));
  const techCount = included.reduce((n, b) => n + b.techniques.length, 0);

  const doImport = () => {
    if (!group) return;
    const elements: PlanElement[] = included.map((b) => ({
      id: `atk-${group.id.toLowerCase()}-${b.tactic}`,
      name: b.name,
      tier: b.tier,
      cves: [],
      techniques: b.techniques.map((t) => ({ id: t.id, name: t.name })),
      description: `${group.name} (${group.id}) — ${b.name} techniques.`,
    }));
    upsertElements(elements);
    setMode("plan");
    onClose();
  };

  // Group the buckets by OAKOC layer for the preview.
  const bucketsForTier = (tier: ThreatTier) => buckets.filter((b) => b.tier === tier);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--bg-base)]/60 backdrop-blur-[2px]">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Import adversary from ATT&amp;CK</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Pull a threat group&apos;s TTPs and map them into the OAKOC layers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 hover:bg-[var(--bg-raised)] rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!group ? (
          /* Step 1 — pick a group */
          <div className="p-5 overflow-y-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search threat groups — e.g. APT29, Cozy Bear, G0016"
                className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[var(--border-default)] bg-[var(--bg-base)] rounded-md text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div className="mt-3 flex flex-col gap-1.5">
              {searching && (
                <div className="flex items-center gap-1.5 px-1 py-2 text-[12px] text-[var(--text-muted)]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Searching…
                </div>
              )}
              {!searching && query.trim() && results.length === 0 && (
                <div className="px-1 py-2 text-[12px] text-[var(--text-muted)]">No groups match.</div>
              )}
              {results.map((g) => (
                <button
                  key={g.id}
                  onClick={() => selectGroup(g)}
                  className="w-full text-left px-3 py-2.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-raised)] transition-colors"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{g.name}</span>
                    <span className="mono text-[11px] text-[var(--text-muted)]">{g.id}</span>
                    <span className="ml-auto text-[11px] text-[var(--text-muted)] tabular-nums">
                      {g.techniqueCount} techniques
                    </span>
                  </div>
                  {g.aliases.length > 0 && (
                    <div className="mt-0.5 text-[11px] text-[var(--text-muted)] truncate">
                      {g.aliases.slice(0, 5).join(" · ")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Step 2 — preview & import */
          <>
            <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center gap-3 shrink-0">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-[var(--text-primary)]">{group.name}</span>{" "}
                <span className="mono text-[11px] text-[var(--text-muted)]">{group.id}</span>
              </div>
            </div>

            <div className="p-5 overflow-y-auto">
              {loadingGroup ? (
                <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[var(--text-muted)]">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading techniques…
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-[var(--text-secondary)] mb-4">
                    Each ATT&amp;CK tactic becomes one element, placed in its OAKOC layer. Uncheck any you
                    don&apos;t want. Defensive layers (Observation, Obstacles) stay yours to fill.
                  </p>
                  {TIER_GROUPS.map((grp) =>
                    grp.tiers.some((t) => bucketsForTier(t).length > 0) ? (
                      <div key={grp.role} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="h-3 w-1 rounded-full" style={{ background: grp.color }} />
                          <span
                            className="text-[10px] font-bold uppercase tracking-[0.14em]"
                            style={{ color: grp.color }}
                          >
                            {grp.label}
                          </span>
                        </div>
                        {grp.tiers.map((tier) =>
                          bucketsForTier(tier).map((b) => {
                            const meta = TIER_META[tier];
                            const on = !excluded.has(b.tactic);
                            return (
                              <label
                                key={b.tactic}
                                className="flex items-start gap-2.5 px-3 py-2 mb-1.5 rounded-md border cursor-pointer transition-colors"
                                style={{
                                  borderColor: "var(--border-default)",
                                  background: on ? meta.tint : "transparent",
                                  opacity: on ? 1 : 0.55,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggle(b.tactic)}
                                  className="mt-0.5 accent-[var(--accent-primary)]"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                                      {b.name}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wide" style={{ color: meta.color }}>
                                      {meta.short}
                                    </span>
                                    <span className="ml-auto text-[11px] text-[var(--text-muted)] tabular-nums">
                                      {b.techniques.length}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 text-[10px] text-[var(--text-muted)] truncate mono">
                                    {b.techniques.slice(0, 6).map((t) => t.id).join(" · ")}
                                    {b.techniques.length > 6 ? " …" : ""}
                                  </div>
                                </div>
                              </label>
                            );
                          }),
                        )}
                      </div>
                    ) : null,
                  )}
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-raised)] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[var(--text-muted)]">
                {included.length} elements · {techCount} techniques
              </span>
              <button
                onClick={doImport}
                disabled={loadingGroup || included.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-[var(--text-inverse)] bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <DownloadCloud className="h-3.5 w-3.5" />
                Import {included.length} elements
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
