"use client";

import { useBriefingStore } from "@/store/useBriefingStore";
import { TIER_META } from "@/lib/oakoc";
import {
  DoorOpen,
  Radar,
  ShieldCheck,
  Server,
  EyeOff,
  type LucideIcon,
  Trash2
} from "lucide-react";
import { ThreatTier } from "@/types";
import { useEffect, useRef, useState } from "react";

const TIER_ICON: Record<ThreatTier, LucideIcon> = {
  "avenue-of-approach": DoorOpen,
  observation: Radar,
  obstacle: ShieldCheck,
  "key-terrain": Server,
  "cover-concealment": EyeOff,
};

/** Chain-name editor with local state: commits to the store debounced (300ms)
    and on blur, so typing doesn't re-render the whole element grid. */
function ChainNameInput({
  chainId,
  name,
  onCommit,
}: {
  chainId: string;
  name: string;
  onCommit: (id: string, name: string) => void;
}) {
  const [value, setValue] = useState(name);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editingRef = useRef(false);

  // Follow external renames (e.g. undo) while not actively editing.
  useEffect(() => {
    if (!editingRef.current) setValue(name);
  }, [name]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (next: string) => {
    editingRef.current = true;
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onCommit(chainId, next);
      editingRef.current = false;
    }, 300);
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    editingRef.current = false;
    if (value !== name) onCommit(chainId, value);
  };

  return (
    <div className="grid flex-1 relative -ml-1">
      <span className="invisible whitespace-pre-wrap text-[13px] font-bold px-1 border border-transparent break-words col-start-1 row-start-1 leading-normal">
        {value || ' '}
      </span>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        rows={1}
        aria-label="Chain name"
        className="resize-none overflow-hidden text-[13px] font-bold text-[var(--text-primary)] bg-transparent border border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:bg-[var(--bg-raised)] rounded px-1 w-full outline-none transition-colors break-words col-start-1 row-start-1 leading-normal"
      />
    </div>
  );
}

export default function SubwayMap() {
  const chains = useBriefingStore((s) => s.chains);
  const elements = useBriefingStore((s) => s.elements);
  const deleteChain = useBriefingStore((s) => s.deleteChain);
  const updateChain = useBriefingStore((s) => s.updateChain);

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Flash effect
      el.style.transition = "box-shadow 0.3s";
      el.style.boxShadow = "0 0 0 2px var(--accent-primary), 0 0 20px rgba(var(--accent-primary-rgb), 0.5)";
      setTimeout(() => {
        el.style.boxShadow = "none";
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col gap-6 sticky top-6">
      <div className="border-b border-[var(--border-subtle)] pb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Attack Scenarios
        </h3>
      </div>
      
      {chains.length === 0 ? (
        <div className="text-[12px] text-[var(--text-muted)] italic py-2">
          No scenarios defined. Click the link icon on a card to start a chain.
        </div>
      ) : (
        chains.map((chain) => {
        // Only show elements that actually exist
        const chainElements = chain.elements
          .map(id => elements.find(e => e.id === id))
          .filter(Boolean) as typeof elements;

        if (chainElements.length === 0) return null;

        return (
          <div key={chain.id} className="relative group/map">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-start gap-2 flex-1 min-w-0 mr-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-[7px]" style={{ backgroundColor: chain.color }} />
                <ChainNameInput
                  chainId={chain.id}
                  name={chain.name}
                  onCommit={(id, name) => updateChain(id, { name })}
                />
              </div>
              <button
                onClick={() => deleteChain(chain.id)}
                className="opacity-0 group-hover/map:opacity-100 transition-opacity p-1 text-[var(--text-muted)] hover:text-[var(--accent-negative)]"
                title="Delete Scenario"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative pl-3">
              {/* Vertical line connecting all nodes */}
              <div 
                className="absolute left-[15px] top-3 bottom-4 w-0.5" 
                style={{ backgroundColor: chain.color, opacity: 0.3 }} 
              />
              
              <div className="flex flex-col gap-3">
                {chainElements.map((el, i) => {
                  const Icon = TIER_ICON[el.tier];
                  const meta = TIER_META[el.tier];
                  const isLast = i === chainElements.length - 1;

                  return (
                    <button
                      key={el.id}
                      onClick={() => scrollToElement(el.id)}
                      className="relative flex items-start gap-3 text-left group/node w-full py-1.5 hover:bg-[var(--bg-raised)] rounded-md transition-colors pr-2 -ml-1 pl-1"
                    >
                      {/* Colored Node */}
                      <div 
                        className="w-3 h-3 rounded-full border-[2px] z-10 shrink-0 mt-[3px]" 
                        style={{ 
                          borderColor: chain.color, 
                          backgroundColor: "var(--bg-base)" 
                        }} 
                      />
                      
                      <div className="flex items-start gap-2 min-w-0">
                        <Icon className="w-3.5 h-3.5 shrink-0 mt-[2px]" style={{ color: meta.color }} />
                        <span className="text-[12px] text-[var(--text-secondary)] group-hover/node:text-[var(--text-primary)] transition-colors break-words leading-snug pt-[1px]">
                          {el.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })
      )}
    </div>
  );
}
