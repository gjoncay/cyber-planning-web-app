"use client";

import { PlanElement } from "@/types";
import { TIER_META } from "@/lib/oakoc";
import { BriefMode, useBriefingStore } from "@/store/useBriefingStore";
import { ShieldAlert, Crosshair, Radar, ShieldCheck, Database, LineChart, Bug, Link2, Plus, Trash2, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";

const DANGER = "#ef4444";

interface ElementCardProps {
  element: PlanElement;
  mode: BriefMode;
  onEdit: (id: string) => void;
}

function severity(element: PlanElement) {
  const kev = element.cves.filter((c) => element.metrics?.[c]?.isExploited);
  let maxEpss = 0;
  for (const c of element.cves) {
    const p = element.metrics?.[c]?.epssPercentile ?? 0;
    if (p > maxEpss) maxEpss = p;
  }
  return { kev, maxEpss, cveCount: element.cves.length };
}

export function ElementCard({ element, mode, onEdit }: ElementCardProps) {
  const meta = TIER_META[element.tier];
  const { kev, maxEpss, cveCount } = severity(element);
  const techs = element.techniques ?? [];
  const dets = element.detections ?? [];
  const mits = element.mitigations ?? [];
  const datacomponents = element.datacomponents ?? [];
  const analytics = element.analytics ?? [];
  const software = element.software ?? [];
  const d3fend = element.d3fend ?? [];
  const isHot = kev.length > 0 || maxEpss >= 0.8;
  const isPlan = mode === "plan";
  const { chains, toggleElementInChain, addChain, deleteChain, elements } = useBriefingStore();

  const [isChainMenuOpen, setIsChainMenuOpen] = useState(false);

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

  const Wrapper: any = isPlan ? "div" : "div";

  const handleCreateChain = (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = `chain-${Date.now()}`;
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    const color = colors[chains.length % colors.length];
    addChain({
      id,
      name: `Chain ${chains.length + 1}`,
      color,
      elements: [element.id]
    });
    setIsChainMenuOpen(false);
  };

  return (
    <Wrapper
      id={element.id}
      {...(isPlan
        ? { onClick: () => onEdit(element.id), type: "button", title: "Edit element" }
        : {})}
      className={`group relative text-left w-full rounded-lg border bg-[var(--bg-surface)] shadow-card transition-colors ${
        isPlan ? "hover:border-[var(--accent-primary)] cursor-pointer" : "cursor-default"
      } ${isFramework ? "border-dashed" : "border-solid"} border-[var(--border-default)]`}
      style={isHot ? { borderColor: `${DANGER}55` } : isFramework ? { opacity: 0.85 } : undefined}
    >
      {/* active chain borders / background indicators */}
      {activeChains.length > 0 && (
        <div className="absolute top-0 right-0 flex p-1 gap-1">
          {activeChains.map(c => (
            <div key={c.id} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} title={`Part of ${c.name}`} />
          ))}
        </div>
      )}

      {/* tier color spine */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[7px]"
        style={{ background: meta.color }}
        aria-hidden
      />

      <div 
        className={isPlan ? "pl-4 pr-3 py-3 cursor-pointer" : "pl-5 pr-4 py-4"} 
        onClick={isPlan ? () => onEdit(element.id) : undefined}
      >
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
          {kev.length > 0 && (
            <span
              className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
              style={{ color: DANGER, backgroundColor: `${DANGER}1a`, border: `1px solid ${DANGER}40` }}
              title={`${kev.length} actively exploited (CISA KEV)`}
            >
              <ShieldAlert className="h-3 w-3" />
              KEV
            </span>
          )}
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
                  color: maxEpss >= 0.8 ? DANGER : maxEpss >= 0.4 ? "var(--accent-secondary)" : "var(--text-muted)",
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
                <span className="font-semibold" style={{ color: DANGER }}>
                  {kev.length} actively exploited
                </span>
              </>
            )}
          </p>
        )}

        {/* ATT&CK techniques — the TTPs this element represents */}
        {techs.length > 0 && isPlan && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {techs.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 mono text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  color: "var(--accent-primary)",
                  borderColor: "var(--border-default)",
                  background: "var(--accent-glow)",
                }}
                title={t.name || t.id}
              >
                <Crosshair className="h-2.5 w-2.5" />
                {t.id}
              </span>
            ))}
            {techs.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{techs.length - 3}</span>
            )}
          </div>
        )}

        {techs.length > 0 && !isPlan && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <Crosshair className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span>{techs.map((t) => t.name || t.id).join(" · ")}</span>
          </p>
        )}

        {/* Detections */}
        {dets.length > 0 && isPlan && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {dets.slice(0, 3).map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1 mono text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  color: "var(--accent-primary)",
                  borderColor: "var(--border-default)",
                  background: "var(--accent-glow)",
                }}
                title={d.name || d.id}
              >
                <Radar className="h-2.5 w-2.5" />
                {d.id}
              </span>
            ))}
            {dets.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{dets.length - 3}</span>
            )}
          </div>
        )}

        {dets.length > 0 && !isPlan && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <Radar className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span>{dets.map((d) => d.name || d.id).join(" · ")}</span>
          </p>
        )}

        {/* Mitigations */}
        {mits.length > 0 && isPlan && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {mits.slice(0, 3).map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 mono text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  color: "var(--accent-primary)",
                  borderColor: "var(--border-default)",
                  background: "var(--accent-glow)",
                }}
                title={m.name || m.id}
              >
                <ShieldCheck className="h-2.5 w-2.5" />
                {m.id}
              </span>
            ))}
            {mits.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{mits.length - 3}</span>
            )}
          </div>
        )}

        {mits.length > 0 && !isPlan && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span>{mits.map((m) => m.name || m.id).join(" · ")}</span>
          </p>
        )}

        {/* Data Components */}
        {datacomponents.length > 0 && isPlan && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {datacomponents.slice(0, 3).map((dc) => (
              <span
                key={dc.id}
                className="inline-flex items-center gap-1 mono text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  color: "var(--accent-primary)",
                  borderColor: "var(--border-default)",
                  background: "var(--accent-glow)",
                }}
                title={dc.name || dc.id}
              >
                <Database className="h-2.5 w-2.5" />
                {dc.id}
              </span>
            ))}
            {datacomponents.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{datacomponents.length - 3}</span>
            )}
          </div>
        )}

        {datacomponents.length > 0 && !isPlan && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <Database className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span>{datacomponents.map((dc) => dc.name || dc.id).join(" · ")}</span>
          </p>
        )}

        {/* Analytics */}
        {analytics.length > 0 && isPlan && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {analytics.slice(0, 3).map((an) => (
              <span
                key={an.id}
                className="inline-flex items-center gap-1 mono text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  color: "var(--accent-primary)",
                  borderColor: "var(--border-default)",
                  background: "var(--accent-glow)",
                }}
                title={an.name || an.id}
              >
                <LineChart className="h-2.5 w-2.5" />
                {an.id}
              </span>
            ))}
            {analytics.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{analytics.length - 3}</span>
            )}
          </div>
        )}

        {analytics.length > 0 && !isPlan && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <LineChart className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span>{analytics.map((an) => an.name || an.id).join(" · ")}</span>
          </p>
        )}

        {/* Software */}
        {software.length > 0 && isPlan && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {software.slice(0, 3).map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 mono text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  color: "var(--accent-primary)",
                  borderColor: "var(--border-default)",
                  background: "var(--accent-glow)",
                }}
                title={s.name || s.id}
              >
                <Bug className="h-2.5 w-2.5" />
                {s.id}
              </span>
            ))}
            {software.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{software.length - 3}</span>
            )}
          </div>
        )}

        {software.length > 0 && !isPlan && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <Bug className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span>{software.map((s) => s.name || s.id).join(" · ")}</span>
          </p>
        )}

        {/* D3FEND Techniques */}
        {d3fend.length > 0 && isPlan && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {d3fend.slice(0, 3).map((d3) => (
              <span
                key={d3.id}
                className="inline-flex items-center gap-1 mono text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  color: "var(--accent-primary)",
                  borderColor: "var(--border-default)",
                  background: "var(--accent-glow)",
                }}
                title={d3.name || d3.id}
              >
                <ShieldCheck className="h-2.5 w-2.5" />
                {d3.id}
              </span>
            ))}
            {d3fend.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{d3fend.length - 3}</span>
            )}
          </div>
        )}

        {d3fend.length > 0 && !isPlan && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span>{d3fend.map((d3) => d3.name || d3.id).join(" · ")}</span>
          </p>
        )}
      </div>

      {isPlan && (
        <div className="absolute bottom-2 right-2">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsChainMenuOpen(!isChainMenuOpen);
              }}
              className="p-1.5 rounded-md hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-transparent hover:border-[var(--border-default)]"
              title="Add to Attack Chain"
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
                        className="opacity-0 group-hover/chain:opacity-100 p-2 text-[var(--text-muted)] hover:text-[#ef4444] transition-all"
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
                      <span className="text-[10px] font-bold uppercase text-[var(--accent-secondary)] flex items-center gap-1">
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
                            const id = `chain-${Date.now()}`;
                            const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
                            const color = colors[chains.length % colors.length];
                            addChain({
                              id,
                              name: `${element.name} -> ${s.name}`,
                              color,
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
    </Wrapper>
  );
}
