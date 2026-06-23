"use client";

import { useState } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { TIER_ORDER, TIER_META } from "@/lib/oakoc";
import { ThreatTier } from "@/types";
import { ElementCard } from "./ElementCard";
import NodeForm from "./NodeForm";
import {
  DoorOpen,
  Radar,
  ShieldCheck,
  Server,
  EyeOff,
  Plus,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

const TIER_ICON: Record<ThreatTier, LucideIcon> = {
  "avenue-of-approach": DoorOpen,
  observation: Radar,
  obstacle: ShieldCheck,
  "key-terrain": Server,
  "cover-concealment": EyeOff,
};

export default function BriefingLayout() {
  const { elements, mode, setSelectedId } = useBriefingStore();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [addTier, setAddTier] = useState<ThreatTier | undefined>(undefined);

  const isPlan = mode === "plan";

  const byTier = (tier: ThreatTier) => elements.filter((el) => el.tier === tier);

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

  return (
    <div className="relative">
      <div className="w-full">
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
            <p className="mt-1.5 text-[13px] text-[var(--text-secondary)] max-w-xl mx-auto">
              OAKOC reads top to bottom — from the ways in, down to the assets that matter,
              and the channels a threat uses to stay hidden.
            </p>
            <div
              className="mx-auto mt-4 h-px w-24 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--accent-primary), var(--accent-secondary), transparent)",
              }}
            />
          </div>
        )}

        {TIER_ORDER.map((tier, i) => {
          const meta = TIER_META[tier];
          const items = byTier(tier);
          const Icon = TIER_ICON[tier];

          return (
            <div key={tier}>
              <section
                className="rounded-xl border border-[var(--border-default)] overflow-hidden"
                style={{ background: meta.tint, borderLeft: `3px solid ${meta.color}` }}
              >
                {/* Layer header — colored by tier, carries the OAKOC framing */}
                <header className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
                  <div
                    className="mono text-[15px] font-bold leading-none pt-0.5 tabular-nums"
                    style={{ color: meta.color }}
                  >
                    {meta.step}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
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
                      <button
                        onClick={() => openAdd(tier)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors text-[var(--text-inverse)] hover:opacity-90"
                        style={{ background: meta.color }}
                        title={`Add to ${meta.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                </header>

                {/* Element cards — auto-laid-out, no dragging */}
                <div className="p-4">
                  {items.length === 0 ? (
                    <button
                      onClick={isPlan ? () => openAdd(tier) : undefined}
                      disabled={!isPlan}
                      className={`w-full rounded-lg border border-dashed border-[var(--border-strong)] py-6 text-center text-[12px] text-[var(--text-muted)] transition-colors ${
                        isPlan ? "hover:text-[var(--text-secondary)] hover:border-[var(--accent-primary)]" : "cursor-default"
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

              {/* Descent connector — the story flows downward */}
              {i < TIER_ORDER.length - 1 && (
                <div className="flex justify-center py-2" aria-hidden>
                  <ChevronDown className="h-5 w-5 text-[var(--border-strong)]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / edit drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[var(--bg-base)]/50 backdrop-blur-[2px]">
          <button
            className="flex-1 cursor-default"
            aria-label="Close"
            onClick={closeDrawer}
          />
          <NodeForm onClose={closeDrawer} defaultTier={addTier} />
        </div>
      )}
    </div>
  );
}
