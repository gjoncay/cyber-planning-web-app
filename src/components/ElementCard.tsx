"use client";

import { PlanElement } from "@/types";
import { TIER_META, chainColor } from "@/lib/oakoc";
import { elementSeverity, HIGH_EPSS_THRESHOLD } from "@/lib/severity";
import { BriefMode, useBriefingStore } from "@/store/useBriefingStore";
import { ShieldAlert, Crosshair, Radar, ShieldCheck, Database, LineChart, Bug, Link2, Plus, Trash2, Sparkles, CloudOff } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

interface ElementCardProps {
  element: PlanElement;
  mode: BriefMode;
  onEdit: (id: string) => void;
}

/** One chip row config so the seven reference lists render identically. */
const REF_SECTIONS = [
  { key: "techniques", icon: Crosshair },
  { key: "detections", icon: Radar },
  { key: "mitigations", icon: ShieldCheck },
  { key: "datacomponents", icon: Database },
  { key: "analytics", icon: LineChart },
  { key: "software", icon: Bug },
  { key: "d3fend", icon: ShieldCheck },
] as const;

type RefKey = (typeof REF_SECTIONS)[number]["key"];

function refsOf(element: PlanElement, key: RefKey): { id: string; name?: string }[] {
  return element[key] ?? [];
}

export const ElementCard = memo(function ElementCard({ element, mode, onEdit }: ElementCardProps) {
  const meta = TIER_META[element.tier];
  const sev = elementSeverity(element);
  const { kev, maxEpss, cveCount, unknown } = sev;
  const isPlan = mode === "plan";

  // Narrow selectors so unrelated store updates don't re-render every card.
  const chains = useBriefingStore((s) => s.chains);
  const elements = useBriefingStore((s) => s.elements);
  const toggleElementInChain = useBriefingStore((s) => s.toggleElementInChain);
  const addChain = useBriefingStore((s) => s.addChain);
  const deleteChain = useBriefingStore((s) => s.deleteChain);

  const [isChainMenuOpen, setIsChainMenuOpen] = useState(false);
  const chainMenuRef = useRef<HTMLDivElement>(null);

  // Chain popover: Escape and outside-click close.
  useEffect(() => {
    if (!isChainMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (chainMenuRef.current && !chainMenuRef.current.contains(e.target as Node)) {
        setIsChainMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsChainMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isChainMenuOpen]);

  const smartSuggestions = useMemo(() => {
    if (!isChainMenuOpen) return [];
    let targetTier = "";
    if (element.tier === "avenue-of-approach") targetTier = "key-terrain";
    else if (element.tier === "key-terrain") targetTier = "avenue-of-approach";
    else if (element.tier === "cover-concealment") targetTier = "key-terrain";

    if (!targetTier) return [];

    return elements.filter(e =>
      e.tier === targetTier &&
      e.id !== element.id &&
      !chains.some(c => c.elements.includes(e.id) && c.elements.includes(element.id))
    ).slice(0, 2);
  }, [element, elements, chains, isChainMenuOpen]);

  // Find which chains this element belongs to
  const activeChains = chains.filter(c => c.elements.includes(element.id));

  const isFramework = element.nature === "framework";

  const handleCreateChain = (e: React.MouseEvent) => {
    e.stopPropagation();
    addChain({
      id: `chain-${Date.now()}`,
      name: `Chain ${chains.length + 1}`,
      color: chainColor(chains.length),
      elements: [element.id]
    });
    setIsChainMenuOpen(false);
  };

  const activate = () => {
    if (isPlan) onEdit(element.id);
  };

  return (
    <div
      id={element.id}
      {...(isPlan
        ? {
            role: "button",
            tabIndex: 0,
            title: "Edit element",
            "aria-label": `Edit ${element.name}`,
            onClick: activate,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activate();
              }
            },
          }
        : {})}
      className={`group relative text-left w-full rounded-lg border bg-[var(--bg-surface)] shadow-card transition-colors ${
        isPlan ? "hover:border-[var(--accent-primary)] cursor-pointer" : "cursor-default"
      } ${isFramework ? "border-dashed" : "border-solid"} border-[var(--border-default)]`}
      style={sev.isHot ? { borderColor: "var(--accent-negative)" } : isFramework ? { opacity: 0.85 } : undefined}
    >
      {/* active chain membership dots — numbered and labeled */}
      {activeChains.length > 0 && (
        <div className="absolute top-0 right-0 flex p-1 gap-1">
          {activeChains.map(c => {
            const n = chains.indexOf(c) + 1;
            return (
              <span
                key={c.id}
                role="img"
                aria-label={`Part of chain ${n}: ${c.name}`}
                title={`Chain ${n}: ${c.name}`}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold leading-none text-white select-none"
                style={{ backgroundColor: c.color }}
              >
                {n}
              </span>
            );
          })}
        </div>
      )}

      {/* tier color spine */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[7px]"
        style={{ background: meta.color }}
        aria-hidden
      />

      <div className={isPlan ? "pl-4 pr-3 py-3" : "pl-5 pr-4 py-4"}>
        <div className="flex items-start justify-between gap-2 pr-4">
          <h4
            className={`font-semibold leading-snug transition-colors flex items-start gap-2 ${
              isPlan ? "text-[13px] group-hover:text-[var(--accent-primary)]" : "text-[15px]"
            }`}
            style={{ color: isFramework ? "var(--text-secondary)" : "var(--text-primary)" }}
          >
            {element.name}
            {isFramework && (
              <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border mt-0.5 whitespace-nowrap" style={{ color: "var(--text-muted)", borderColor: "var(--border-default)", background: "var(--bg-raised)" }}>
                Framework
              </span>
            )}
          </h4>
          <span className="shrink-0 inline-flex items-center gap-1.5">
            {kev.length > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                style={{
                  color: "var(--accent-negative)",
                  backgroundColor: "var(--accent-negative-glow)",
                  border: "1px solid var(--accent-negative)",
                }}
                title={`${kev.length} actively exploited (CISA KEV)`}
              >
                <ShieldAlert className="h-3 w-3" />
                KEV
              </span>
            )}
            {unknown.length > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                style={{
                  color: "var(--text-muted)",
                  backgroundColor: "var(--bg-raised)",
                  border: "1px solid var(--border-default)",
                }}
                title={`KEV/EPSS enrichment unavailable for ${unknown.join(", ")} — exploitation status unknown. Will retry on next save.`}
              >
                <CloudOff className="h-3 w-3" />
                Intel unavailable
              </span>
            )}
          </span>
        </div>

        {element.description && (
          <p
            className={`mt-1.5 text-[var(--text-secondary)] leading-relaxed ${
              isPlan ? "text-[12px] line-clamp-2" : "text-[13px]"
            }`}
          >
            {element.description}
          </p>
        )}

        {/* Plan: technical detail (CVE chips + EPSS). Brief: plain-language read. */}
        {cveCount > 0 && isPlan && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {element.cves.slice(0, 3).map((c) => (
              <span
                key={c}
                className="mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-raised)] border border-[var(--border-default)] text-[var(--text-secondary)]"
              >
                {c}
              </span>
            ))}
            {cveCount > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{cveCount - 3}</span>
            )}
            {maxEpss > 0 && (
              <span
                className="ml-auto mono text-[10px] font-bold tabular-nums"
                style={{
                  color:
                    maxEpss >= HIGH_EPSS_THRESHOLD
                      ? "var(--accent-negative)"
                      : maxEpss >= 0.4
                        ? "var(--accent-warning)"
                        : "var(--text-muted)",
                }}
                title="Highest EPSS likelihood among assigned CVEs"
              >
                {Math.round(maxEpss * 100)}% EPSS
              </span>
            )}
          </div>
        )}

        {cveCount > 0 && !isPlan && (
          <p className="mt-2.5 text-[12px] text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)] tabular-nums">{cveCount}</span>{" "}
            {cveCount === 1 ? "vulnerability" : "vulnerabilities"}
            {kev.length > 0 && (
              <>
                {" · "}
                <span className="font-semibold" style={{ color: "var(--accent-negative)" }}>
                  {kev.length} actively exploited
                </span>
              </>
            )}
            {unknown.length > 0 && (
              <>
                {" · "}
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>
                  {unknown.length} intel unavailable
                </span>
              </>
            )}
          </p>
        )}

        {/* Reference chips (techniques, detections, mitigations, …) */}
        {REF_SECTIONS.map(({ key, icon: SectionIcon }) => {
          const refs = refsOf(element, key);
          if (refs.length === 0) return null;
          return isPlan ? (
            <div key={key} className="mt-2 flex flex-wrap items-center gap-1.5">
              {refs.slice(0, 3).map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 mono text-[10px] px-1.5 py-0.5 rounded border"
                  style={{
                    color: "var(--accent-primary)",
                    borderColor: "var(--border-default)",
                    background: "var(--accent-glow)",
                  }}
                  title={r.name || r.id}
                >
                  <SectionIcon className="h-2.5 w-2.5" />
                  {r.id}
                </span>
              ))}
              {refs.length > 3 && (
                <span className="text-[10px] text-[var(--text-muted)]">+{refs.length - 3}</span>
              )}
            </div>
          ) : (
            <p key={key} className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)]">
              <SectionIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
              <span>{refs.map((r) => r.name || r.id).join(" · ")}</span>
            </p>
          );
        })}
      </div>

      {isPlan && (
        <div className="absolute bottom-2 right-2">
          <div className="relative" ref={chainMenuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isChainMenuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setIsChainMenuOpen(!isChainMenuOpen);
              }}
              className="p-1.5 rounded-md hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-transparent hover:border-[var(--border-default)]"
              title="Add to Attack Chain"
              aria-label={`Manage attack chains for ${element.name}`}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>

            {isChainMenuOpen && (
              <div className="absolute right-0 bottom-full mb-1 z-10 w-48 bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md shadow-card overflow-hidden">
                <div className="p-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Attack Chains</span>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {chains.map(c => (
                    <div key={c.id} className="flex items-center hover:bg-[var(--bg-raised)] group/chain">
                      <button
                        className="flex-1 text-left px-3 py-2 text-[12px] flex items-center justify-between"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleElementInChain(c.id, element.id);
                          setIsChainMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="truncate" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                        </div>
                        {c.elements.includes(element.id) && (
                          <span className="text-[10px] text-[var(--accent-primary)]">✓</span>
                        )}
                      </button>
                      <button
                        className="opacity-0 group-hover/chain:opacity-100 p-2 text-[var(--text-muted)] hover:text-[var(--accent-negative)] transition-all"
                        title="Delete chain"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChain(c.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {smartSuggestions.length > 0 && (
                  <>
                    <div className="p-2 border-y border-[var(--border-subtle)] bg-[var(--bg-base)]">
                      <span className="text-[10px] font-bold uppercase text-[var(--accent-primary)] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Smart Links
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {smartSuggestions.map(s => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 text-[12px] hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] flex items-center justify-between group/smart"
                          onClick={(e) => {
                            e.stopPropagation();
                            addChain({
                              id: `chain-${Date.now()}`,
                              name: `${element.name} -> ${s.name}`,
                              color: chainColor(chains.length),
                              elements: [element.id, s.id]
                            });
                            setIsChainMenuOpen(false);
                          }}
                        >
                          <span className="truncate group-hover/smart:text-[var(--text-primary)]">Auto-link to {s.name}</span>
                          <Plus className="w-3 h-3 opacity-50 group-hover/smart:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="p-1 border-t border-[var(--border-subtle)] bg-[var(--bg-raised)]">
                  <button
                    className="w-full text-left px-3 py-2 text-[12px] hover:bg-[var(--bg-raised)] flex items-center gap-2 text-[var(--accent-primary)]"
                    onClick={handleCreateChain}
                  >
                    <Plus className="w-3 h-3" />
                    New Chain
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
