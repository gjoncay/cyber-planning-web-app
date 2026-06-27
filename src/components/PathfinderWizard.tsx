"use client";

import { useBriefingStore } from "@/store/useBriefingStore";
import { PlanElement } from "@/types";
import { Sparkles, X, Plus, Check } from "lucide-react";
import { useState, useMemo } from "react";

interface PathfinderWizardProps {
  onClose: () => void;
}

export default function PathfinderWizard({ onClose }: PathfinderWizardProps) {
  const { elements, chains, addChain } = useBriefingStore();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const suggestedPaths = useMemo(() => {
    const starts = elements.filter(e => e.tier === "avenue-of-approach");
    const covers = elements.filter(e => e.tier === "cover-concealment");
    const ends = elements.filter(e => e.tier === "key-terrain");

    const paths: { id: string, name: string, elements: PlanElement[] }[] = [];

    // Simple heuristic: connect each start to each end, optionally through a cover.
    starts.forEach(start => {
      ends.forEach(end => {
        // Direct path
        paths.push({
          id: `path-${start.id}-${end.id}`,
          name: `${start.name} to ${end.name}`,
          elements: [start, end]
        });

        // Path through cover
        covers.forEach(cover => {
          paths.push({
            id: `path-${start.id}-${cover.id}-${end.id}`,
            name: `${start.name} via ${cover.name}`,
            elements: [start, cover, end]
          });
        });
      });
    });

    // Filter out paths that already perfectly match an existing chain
    return paths.filter(p => {
      const pIds = p.elements.map(e => e.id).join(",");
      return !chains.some(c => c.elements.join(",") === pIds);
    }).slice(0, 10); // Limit to top 10 for simplicity
  }, [elements, chains]);

  const togglePath = (id: string) => {
    const next = new Set(selectedPaths);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedPaths(next);
  };

  const doImport = () => {
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    
    suggestedPaths.forEach(path => {
      if (selectedPaths.has(path.id)) {
        addChain({
          id: `chain-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: path.name,
          color: colors[chains.length % colors.length], // color will just pick the next based on current length (not dynamically updating length mid-loop, but close enough)
          elements: path.elements.map(e => e.id)
        });
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[var(--bg-base)]/60 backdrop-blur-[2px]">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card overflow-hidden">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Pathfinder Wizard</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Auto-generate plausible attack chains from your assets.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {suggestedPaths.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-[var(--text-muted)]">
              No new logical paths found. Make sure you have Tangible elements in the Avenue of Approach and Key Terrain layers.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {suggestedPaths.map(path => {
                const isSelected = selectedPaths.has(path.id);
                return (
                  <button
                    key={path.id}
                    onClick={() => togglePath(path.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      isSelected ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "border-[var(--border-default)] bg-[var(--bg-raised)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-[13px] font-bold ${isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"}`}>
                        {path.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {path.elements.map((el, idx) => (
                          <div key={el.id} className="flex items-center gap-1.5">
                            <span className="text-[11px] text-[var(--text-secondary)]">{el.name}</span>
                            {idx < path.elements.length - 1 && <span className="text-[10px] text-[var(--text-muted)]">→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--text-inverse)]" : "border-[var(--border-strong)]"
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-raised)] flex items-center justify-end shrink-0 gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Cancel
          </button>
          <button
            onClick={doImport}
            disabled={selectedPaths.size === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-[var(--text-inverse)] bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Create {selectedPaths.size} {selectedPaths.size === 1 ? 'Chain' : 'Chains'}
          </button>
        </div>

      </div>
    </div>
  );
}
