"use client";

import { useEffect, useState } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { getRecommendedDefenses, D3fendTechnique } from "@/lib/api";
import { PlanElement, ThreatTier } from "@/types";
import { X, Shield, RefreshCw, DownloadCloud, Info } from "lucide-react";

interface RecommendDefensesProps {
  onClose: () => void;
}

export default function RecommendDefenses({ onClose }: RecommendDefensesProps) {
  const { elements, upsertElements } = useBriefingStore();
  
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<D3fendTechnique[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scannedTtpCount, setScannedTtpCount] = useState(0);

  useEffect(() => {
    async function load() {
      // 1. Gather all ATT&CK techniques from the planner
      const ttpIds = new Set<string>();
      for (const el of Object.values(elements)) {
        if (el.techniques && el.techniques.length > 0) {
          el.techniques.forEach(t => ttpIds.add(t.id));
        }
      }

      setScannedTtpCount(ttpIds.size);

      if (ttpIds.size === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch recommendations from D3FEND mapping
      const results = await getRecommendedDefenses(Array.from(ttpIds));
      setRecommendations(results);
      
      // Auto-select all by default to make "auto-add" easy
      setSelected(new Set(results.map(r => r.id)));
      
      setLoading(false);
    }
    load();
  }, [elements]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selected.size === recommendations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(recommendations.map(r => r.id)));
    }
  };

  const doImport = () => {
    if (selected.size === 0) return;
    
    const elementsToImport = Array.from(selected).map(id => {
      return recommendations.find(r => r.id === id);
    }).filter((r): r is D3fendTechnique => r !== undefined);

    const newElements: PlanElement[] = elementsToImport.map((def) => {
      const cat = (def.category || "").toLowerCase();
      let tier: ThreatTier = "obstacle";
      if (cat.includes("detect") || cat.includes("monitor") || cat.includes("analy")) {
        tier = "observation";
      }

      return {
        id: `d3f-${def.id.toLowerCase()}`,
        name: def.name,
        nature: "framework",
        tier,
        cves: [],
        d3fend: [{ id: def.id, name: def.name }],
        description: `${def.description}\n\nMitigates: ${def.mitigates.join(", ")}`,
      };
    });
    
    upsertElements(newElements);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--bg-base)]/60 backdrop-blur-[2px]">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] shrink-0 bg-[var(--bg-raised)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
              <Shield className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Recommend Defenses</h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Automatically suggest D3FEND countermeasures based on the ATT&CK techniques in your plan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 hover:bg-[var(--bg-base)] rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
              <div className="text-[13px]">Analyzing your attack chains...</div>
            </div>
          ) : scannedTtpCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Info className="w-8 h-8 text-[var(--text-muted)] mb-3" />
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">No ATT&CK Techniques Found</h3>
              <p className="text-[13px] text-[var(--text-secondary)] max-w-sm">
                To recommend defenses, you first need to add offensive ATT&CK techniques to your Avenues of Approach or Cover & Concealment layers.
              </p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="w-8 h-8 text-[var(--accent-primary)] mb-3" />
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">No Recommendations Available</h3>
              <p className="text-[13px] text-[var(--text-secondary)] max-w-sm">
                We scanned {scannedTtpCount} technique(s) in your plan, but couldn't find any direct D3FEND mappings for them.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  Found {recommendations.length} countermeasures for {scannedTtpCount} offensive technique(s):
                </p>
                <button 
                  onClick={toggleAll}
                  className="text-[12px] font-medium text-[var(--accent-primary)] hover:underline"
                >
                  {selected.size === recommendations.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {recommendations.map((def) => {
                const on = selected.has(def.id);
                const isObs = def.category?.toLowerCase().includes("detect") || 
                              def.category?.toLowerCase().includes("analy") || 
                              def.category?.toLowerCase().includes("monitor");
                
                return (
                  <label
                    key={def.id}
                    className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      borderColor: on ? "var(--accent-primary)" : "var(--border-default)",
                      background: on ? "var(--accent-primary)]/5" : "var(--bg-base)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(def.id)}
                      className="mt-1 accent-[var(--accent-primary)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)]">{def.name}</span>
                        <span className="mono text-[11px] text-[var(--text-muted)] bg-[var(--bg-raised)] px-1.5 py-0.5 rounded">{def.id}</span>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-sm" style={{
                          background: isObs ? "rgba(59, 130, 246, 0.1)" : "rgba(234, 179, 8, 0.1)",
                          color: isObs ? "#3b82f6" : "#eab308"
                        }}>
                          {isObs ? "Observation" : "Obstacle"}
                        </span>
                      </div>
                      <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                        {def.description}
                      </div>
                      <div className="mt-2 text-[11px] font-medium text-[var(--text-muted)]">
                        Mitigates: {def.mitigates.join(", ")}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-raised)] flex items-center justify-between shrink-0">
          <span className="text-[12px] font-medium text-[var(--text-muted)]">
            {selected.size} defenses selected
          </span>
          <button
            onClick={doImport}
            disabled={selected.size === 0 || recommendations.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-bold text-[var(--text-inverse)] bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <DownloadCloud className="h-4 w-4" />
            Import Selected
          </button>
        </div>
      </div>
    </div>
  );
}
