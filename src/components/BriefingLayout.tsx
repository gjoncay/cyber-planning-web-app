"use client";

import { useState, type ReactNode } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { TIER_ORDER, TIER_META, TIER_GROUPS } from "@/lib/oakoc";
import { ThreatTier } from "@/types";
import { ElementCard } from "./ElementCard";
import NodeForm from "./NodeForm";
import ImportAdversary from "./ImportAdversary";
import ImportDetections from "./ImportDetections";
import ImportMitigations from "./ImportMitigations";
import ImportDataComponents from "./ImportDataComponents";
import ImportAnalytics from "./ImportAnalytics";
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
  Database,
  LineChart,
  type LucideIcon,
} from "lucide-react";

const TIER_ICON: Record<ThreatTier, LucideIcon> = {
  "avenue-of-approach": DoorOpen,
  observation: Radar,
  obstacle: ShieldCheck,
  "key-terrain": Server,
  "cover-concealment": EyeOff,
};

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
  const { elements, mode, setSelectedId, clearTier } = useBriefingStore();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [addTier, setAddTier] = useState<ThreatTier | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);
  const [showImportDetections, setShowImportDetections] = useState(false);
  const [showImportMitigations, setShowImportMitigations] = useState(false);
  const [showImportDataComponents, setShowImportDataComponents] = useState(false);
  const [showImportAnalytics, setShowImportAnalytics] = useState(false);

  const isPlan = mode === "plan";

  const byTier = (tier: ThreatTier) => elements.filter((el) => el.tier === tier);
  const namesIn = (tier: ThreatTier) => byTier(tier).map((el) => el.name);

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
    <div className="relative">
      <div className="w-full">
        {/* Plan-mode toolbar — start from a real adversary's TTPs */}
        {isPlan && (
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[12px] text-[var(--text-secondary)]">
              Build the story for how a threat operates. Add elements per layer, or import threat actor TTPs.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportMitigations(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors text-[var(--accent-primary)] hover:text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]"
                style={{ borderColor: "var(--accent-primary)" }}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Import Mitigations
              </button>
              <button
                onClick={() => setShowImportDetections(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors text-[var(--accent-primary)] hover:text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]"
                style={{ borderColor: "var(--accent-primary)" }}
              >
                <Radar className="h-3.5 w-3.5" />
                Import Detections
              </button>
              <button
                onClick={() => setShowImportDataComponents(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors text-[var(--accent-primary)] hover:text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]"
                style={{ borderColor: "var(--accent-primary)" }}
              >
                <Database className="h-3.5 w-3.5" />
                Import Data Components
              </button>
              <button
                onClick={() => setShowImportAnalytics(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors text-[var(--accent-primary)] hover:text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]"
                style={{ borderColor: "var(--accent-primary)" }}
              >
                <LineChart className="h-3.5 w-3.5" />
                Import Analytics
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors text-[var(--accent-primary)] hover:text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]"
                style={{ borderColor: "var(--accent-primary)" }}
              >
                <Users className="h-3.5 w-3.5" />
                Import Threat Actor TTPs
              </button>
            </div>
          </div>
        )}

        {/* Brief mode opens with the story framing for the room. */}
        {!isPlan && (
          <div className="mb-7 text-center">
            <span className="data-label" style={{ color: "var(--accent-secondary)" }}>
              Threat Briefing
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              How the adversary moves through our{" "}
              <span style={{ color: "var(--accent-primary)" }}>terrain</span>
            </h2>
            {renderStory()}
            <div
              className="mx-auto mt-5 h-px w-24 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--accent-primary), var(--accent-secondary), transparent)",
              }}
            />
          </div>
        )}

        {TIER_GROUPS.map((group) => (
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
                    className="rounded-xl border border-[var(--border-default)] overflow-hidden"
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
                          {!isPlan && (
                            <span
                              className="text-[12px] font-semibold italic"
                              style={{ color: meta.color }}
                            >
                              — {meta.brief}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                          {meta.definition}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 pt-0.5">
                        <span className="text-[11px] text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                          {items.length} {items.length === 1 ? "element" : "elements"}
                        </span>
                        {isPlan && (
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
                        )}
                      </div>
                    </header>

                    <div className="p-4">
                      {items.length === 0 ? (
                        <button
                          onClick={isPlan ? () => openAdd(tier) : undefined}
                          disabled={!isPlan}
                          className={`w-full rounded-lg border border-dashed border-[var(--border-strong)] py-6 text-center text-[12px] text-[var(--text-muted)] transition-colors ${
                            isPlan
                              ? "hover:text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                              : "cursor-default"
                          }`}
                        >
                          {isPlan ? `Add the first ${meta.short.toLowerCase()} element` : "No elements in this layer"}
                        </button>
                      ) : (
                        <div
                          className={`grid gap-3 ${
                            isPlan
                              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                              : "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
                          }`}
                        >
                          {items.map((el) => (
                            <ElementCard key={el.id} element={el} mode={mode} onEdit={openEdit} />
                          ))}
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
        <div className="fixed inset-0 z-50 flex justify-end bg-[var(--bg-base)]/50 backdrop-blur-[2px]">
          <button className="flex-1 cursor-default" aria-label="Close" onClick={closeDrawer} />
          <NodeForm onClose={closeDrawer} defaultTier={addTier} />
        </div>
      )}

      {showImport && <ImportAdversary onClose={() => setShowImport(false)} />}
      {showImportDetections && <ImportDetections onClose={() => setShowImportDetections(false)} />}
      {showImportMitigations && <ImportMitigations onClose={() => setShowImportMitigations(false)} />}
      {showImportDataComponents && <ImportDataComponents onClose={() => setShowImportDataComponents(false)} />}
      {showImportAnalytics && <ImportAnalytics onClose={() => setShowImportAnalytics(false)} />}
    </div>
  );
}
