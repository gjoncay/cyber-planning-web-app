"use client";

import { useEffect, useRef, useState } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { searchAnalytics, Analytic } from "@/lib/api";
import { PlanElement } from "@/types";
import { X, Search, RefreshCw, LineChart, DownloadCloud } from "lucide-react";

interface ImportAnalyticsProps {
  onClose: () => void;
}

export default function ImportAnalytics({ onClose }: ImportAnalyticsProps) {
  const upsertElements = useBriefingStore((s) => s.upsertElements);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Analytic[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    queryRef.current = q;
    
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchAnalytics(q);
      if (queryRef.current !== q) return;
      setResults(r);
      setSearching(false);
    }, 200);
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const doImport = () => {
    if (selected.size === 0) return;
    
    const elementsToImport = Array.from(selected).map(id => {
      return results.find(r => r.id === id);
    }).filter((an): an is Analytic => an !== undefined);

    const elements: PlanElement[] = elementsToImport.map((an) => ({
      id: `an-${an.id.toLowerCase()}`,
      name: `Analytic: ${an.id}`,
      nature: "framework",
      tier: "observation",
      cves: [],
      analytics: [{ id: an.id, name: `Analytic: ${an.id}` }],
      description: `${an.description}\n\nPlatform: ${an.platform}\nDomain: ${an.domain}${an.relatedDetection ? `\nRelated Detection: ${an.relatedDetection}` : ""}`,
    }));
    
    upsertElements(elements);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--bg-base)]/60 backdrop-blur-[2px]">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-[var(--accent-primary)]" />
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Import Analytics</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Select MITRE Analytics to pre-fill the Observation layer.
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

        <div className="p-5 overflow-y-auto">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Analytics — e.g. AN0001 or DET0001"
              className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[var(--border-default)] bg-[var(--bg-base)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            {searching && (
              <div className="flex items-center gap-1.5 px-1 py-2 text-[12px] text-[var(--text-muted)]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Searching…
              </div>
            )}
            {!searching && results.length === 0 && (
              <div className="px-1 py-2 text-[12px] text-[var(--text-muted)]">No Analytics match.</div>
            )}
            {results.map((an) => {
              const on = selected.has(an.id);
              return (
                <label
                  key={an.id}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-md border cursor-pointer transition-colors"
                  style={{
                    borderColor: on ? "var(--accent-primary)" : "var(--border-default)",
                    background: on ? "var(--bg-raised)" : "var(--bg-surface)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(an.id)}
                    className="mt-1 accent-[var(--accent-primary)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-[var(--text-primary)]">{an.id}</span>
                      {an.relatedDetection && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-glow)] text-[var(--accent-primary)]">
                          {an.relatedDetection}
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-[var(--text-muted)] tabular-nums">
                        {an.platform}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--text-secondary)] line-clamp-2">
                      {an.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-raised)] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[var(--text-muted)]">
            {selected.size} analytics selected
          </span>
          <button
            onClick={doImport}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-[var(--text-inverse)] bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <DownloadCloud className="h-3.5 w-3.5" />
            Import {selected.size} {selected.size === 1 ? 'analytic' : 'analytics'}
          </button>
        </div>
      </div>
    </div>
  );
}
