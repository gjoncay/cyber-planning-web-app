"use client";

import { useState, type ReactNode } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { TIER_ORDER, TIER_META, TIER_GROUPS } from "@/lib/oakoc";
import { ThreatTier } from "@/types";
import { ElementCard } from "./ElementCard";
import NodeForm from "./NodeForm";
import ImportAdversary from "./ImportAdversary";
import ImportPicker from "./ImportPicker";
import ModalShell from "./ModalShell";
import RecommendDefenses from "./RecommendDefenses";
import SubwayMap from "./SubwayMap";
import SwimlanesView from "./SwimlanesView";
import DashboardView from "./DashboardView";
import PathfinderWizard from "./PathfinderWizard";
import ChainBuilderView from "./ChainBuilderView";
import {
  DoorOpen,
  Radar,
  ShieldCheck,
  Server,
  EyeOff,
  Plus,
  ChevronDown,
  Users,
  Trash2,
  Library,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const TIER_ICON: Record<ThreatTier, LucideIcon> = {
  "avenue-of-approach": DoorOpen,
  observation: Radar,
  obstacle: ShieldCheck,
  "key-terrain": Server,
  "cover-concealment": EyeOff,
};

/** Shared outline style for the Plan-mode toolbar buttons. */
const TOOLBAR_BTN_CLASS =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors text-[var(--accent-primary)] hover:text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]";
const TOOLBAR_BTN_STYLE = { borderColor: "var(--accent-primary)" } as const;

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={TOOLBAR_BTN_CLASS} style={TOOLBAR_BTN_STYLE}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/** Comma + "and" joined list of element names, in primary ink. */
function nameList(names: string[]): ReactNode {
  if (names.length === 0) return null;
  return names.map((n, i) => (
    <span key={n}>
      <strong className="font-semibold text-[var(--text-primary)]">{n}</strong>
      {i < names.length - 2 ? ", " : i === names.length - 2 ? " and " : ""}
    </span>
  ));
}

/** Join clause fragments with commas and a trailing "and". */
function joinClauses(clauses: ReactNode[]): ReactNode {
  return clauses.map((c, i) => (
    <span key={i}>
      {i === 0 ? "" : i === clauses.length - 1 ? ", and" : ","}
      {c}
    </span>
  ));
}

export default function BriefingLayout() {
  const { elements, chains, mode, setSelectedId, clearTier, clearAll } = useBriefingStore();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [addTier, setAddTier] = useState<ThreatTier | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showRecommendDefenses, setShowRecommendDefenses] = useState(false);
  const [showPathfinder, setShowPathfinder] = useState(false);
  const [briefView, setBriefView] = useState<"swimlanes" | "dashboard">("swimlanes");
  const [planView, setPlanView] = useState<"grid" | "builder">("grid");

  const isPlan = mode === "plan";

  const byTier = (tier: ThreatTier) => elements.filter((el) => el.tier === tier);
  const namesIn = (tier: ThreatTier) => byTier(tier).filter(el => el.nature !== "framework").map((el) => el.name);

  const openAdd = (tier: ThreatTier) => {
    setSelectedId(null);
    setAddTier(tier);
    setDrawerOpen(true);
  };
  const openEdit = (id: string) => {
    setSelectedId(id);
    setAddTier(undefined);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
    setAddTier(undefined);
  };

  // The auto-generated story, in the analyst's own narrative structure.
  const renderStory = () => {
    const avenue = namesIn("avenue-of-approach");
    const cover = namesIn("cover-concealment");
    const key = namesIn("key-terrain");
    const obs = namesIn("observation");
    const obstacle = namesIn("obstacle");

    const adv: ReactNode[] = [];
    if (avenue.length) adv.push(<> reaches the environment through {nameList(avenue)}</>);
    if (cover.length) adv.push(<> stays hidden with {nameList(cover)}</>);
    if (key.length) adv.push(<> and targets {nameList(key)}</>);

    const def: ReactNode[] = [];
    if (obs.length) def.push(<> observes with {nameList(obs)}</>);
    if (obstacle.length) def.push(<> blocks with {nameList(obstacle)}</>);

    if (adv.length === 0 && def.length === 0) return null;

    return (
      <p className="mt-4 mx-auto max-w-3xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
        {adv.length > 0 && (
          <>
            The adversary{joinClauses(adv)}.{" "}
          </>
        )}
        {def.length > 0 && (
          <>
            The defender{joinClauses(def)}.
          </>
        )}
      </p>
    );
  };

  let position = 0;
  const lastIndex = TIER_ORDER.length - 1;

  return (
    <div className={`flex flex-col gap-6 ${isPlan ? "xl:flex-row" : ""}`}>
      {/* Subway Map Sidebar - Only visible in Plan mode now since Brief mode has its own full-page views */}
      {isPlan && (
        <div className="xl:w-64 shrink-0 order-2 xl:order-1">
          <SubwayMap />
        </div>
      )}

      <div className="relative flex-1 min-w-0 order-1 xl:order-2">
        <div className="w-full">
          {/* Plan-mode toolbar — start from a real adversary's TTPs */}
        {isPlan && (
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Build the story for how a threat operates. Add elements per layer, or import threat actor TTPs.
              </p>
              {elements.length > 0 && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 self-start text-[11px] font-semibold text-[var(--accent-negative)] hover:text-[var(--text-inverse)] hover:bg-[var(--accent-negative)] px-2 py-1 rounded-md transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All Elements
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ToolbarButton icon={Shield} label="Recommend Defenses" onClick={() => setShowRecommendDefenses(true)} />
              <ToolbarButton icon={Library} label="Add from library" onClick={() => setShowLibrary(true)} />
              <ToolbarButton icon={Users} label="Import Threat Actor TTPs" onClick={() => setShowImport(true)} />
              <ToolbarButton icon={Sparkles} label="Auto-Generate Chains" onClick={() => setShowPathfinder(true)} />
            </div>
          </div>
        )}

        {isPlan && (
          <div className="flex justify-start mb-4">
            <div className="inline-flex items-center p-1 bg-[var(--bg-raised)] rounded-lg border border-[var(--border-default)] shadow-sm">
              <button
                onClick={() => setPlanView("grid")}
                className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${
                  planView === "grid"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setPlanView("builder")}
                className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${
                  planView === "builder"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                }`}
              >
                Visual Chain Builder
              </button>
            </div>
          </div>
        )}

        {isPlan && planView === "builder" && (
          <ChainBuilderView />
        )}

        {/* Brief mode opens with the story framing for the room. */}
        {!isPlan && (
          <div className="mb-7">
            <div className="text-center mb-6">
              <span className="data-label">
                Threat Briefing
              </span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Executive <span style={{ color: "var(--accent-primary)" }}>Summary</span>
              </h2>
            </div>
            
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center p-1 bg-[var(--bg-raised)] rounded-lg border border-[var(--border-default)] shadow-sm">
                <button
                  onClick={() => setBriefView("swimlanes")}
                  className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${
                    briefView === "swimlanes"
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                  }`}
                >
                  Kill Chain Swimlanes
                </button>
                <button
                  onClick={() => setBriefView("dashboard")}
                  className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${
                    briefView === "dashboard"
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                  }`}
                >
                  Executive Dashboard
                </button>
              </div>
            </div>

            {briefView === "swimlanes" && <SwimlanesView />}
            {briefView === "dashboard" && <DashboardView />}
          </div>
        )}

        {/* Plan Mode Grid */}
        {isPlan && planView === "grid" && TIER_GROUPS.map((group) => (
          <div key={group.role}>
            {/* Story act divider — adversary maneuver / objective / defensive response */}
            <div className="flex items-center gap-3 mb-3 mt-2 first:mt-0">
              <span
                className="h-4 w-1 rounded-full"
                style={{ background: group.color }}
                aria-hidden
              />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: group.color }}
              >
                {group.label}
              </span>
              <span className="h-px flex-1 bg-[var(--border-default)]" />
            </div>

            {group.tiers.map((tier) => {
              const meta = TIER_META[tier];
              const items = byTier(tier);
              const Icon = TIER_ICON[tier];
              const showConnector = position < lastIndex;
              position += 1;

              return (
                <div key={tier}>
                  <section
                    className="rounded-xl border border-[var(--border-default)]"
                    style={{ background: meta.tint, borderLeft: `3px solid ${meta.color}` }}
                  >
                    <header className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
                      <div
                        className="mono text-[15px] font-bold leading-none pt-0.5 tabular-nums"
                        style={{ color: meta.color }}
                      >
                        {meta.step}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Icon className="h-4 w-4 shrink-0" style={{ color: meta.color }} />
                          <h3 className="text-[14px] font-bold tracking-tight text-[var(--text-primary)]">
                            {meta.name}
                          </h3>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                          {meta.definition}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 pt-0.5">
                        <span className="text-[11px] text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                          {items.length} {items.length === 1 ? "element" : "elements"}
                        </span>
                        <div className="flex items-center gap-2">
                          {items.length > 0 && (
                            <button
                              onClick={() => clearTier(tier)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors text-[var(--text-secondary)] hover:text-[var(--accent-negative)] hover:bg-[var(--bg-sunken)]"
                              title={`Clear all in ${meta.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => openAdd(tier)}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-opacity text-[var(--text-inverse)] hover:opacity-90"
                            style={{ background: meta.color }}
                            title={`Add to ${meta.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        </div>
                      </div>
                    </header>

                    <div className="p-4">
                      {items.length === 0 ? (
                        <button
                          onClick={() => openAdd(tier)}
                          className="w-full rounded-lg border border-dashed border-[var(--border-strong)] py-6 text-center text-[12px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                        >
                          Add the first {meta.short.toLowerCase()} element
                        </button>
                      ) : (
                        <div className="flex flex-col gap-6">
                          {(() => {
                            const tangibles = items.filter(el => el.nature !== "framework");
                            const frameworks = items.filter(el => el.nature === "framework");
                            return (
                              <>
                                {tangibles.length > 0 && (
                                  <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">Real-World Assets & Actions</h4>
                                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                      {tangibles.map((el) => (
                                        <ElementCard key={el.id} element={el} mode={mode} onEdit={openEdit} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {frameworks.length > 0 && (
                                  <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Frameworks & Best Practices</h4>
                                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                      {frameworks.map((el) => (
                                        <ElementCard key={el.id} element={el} mode={mode} onEdit={openEdit} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </section>

                  {showConnector && (
                    <div className="flex justify-center py-2" aria-hidden>
                      <ChevronDown className="h-5 w-5 text-[var(--border-strong)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Add / edit drawer */}
      {isDrawerOpen && (
        <ModalShell
          onClose={closeDrawer}
          label={addTier ? "Add element" : "Edit element"}
          variant="drawer"
          zIndexClassName="z-50"
          panelClassName="h-full w-full md:max-w-md flex"
        >
          <NodeForm onClose={closeDrawer} defaultTier={addTier} />
        </ModalShell>
      )}

      {showImport && <ImportAdversary onClose={() => setShowImport(false)} />}
      {showLibrary && <ImportPicker onClose={() => setShowLibrary(false)} />}
      {showRecommendDefenses && <RecommendDefenses onClose={() => setShowRecommendDefenses(false)} />}
      {showPathfinder && <PathfinderWizard onClose={() => setShowPathfinder(false)} />}
    </div>
    </div>
  );
}
