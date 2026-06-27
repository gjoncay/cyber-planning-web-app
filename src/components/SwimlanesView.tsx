"use client";

import { useBriefingStore } from "@/store/useBriefingStore";
import { TIER_META } from "@/lib/oakoc";
import { ArrowDown } from "lucide-react";
import { ElementCard } from "./ElementCard";

export default function SwimlanesView() {
  const { chains, elements, mode } = useBriefingStore();

  if (chains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--border-strong)] rounded-xl bg-[var(--bg-surface)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Attack Chains Defined</h3>
        <p className="text-[14px] text-[var(--text-secondary)] max-w-md">
          Switch to Plan mode and use the link icon on elements to group them into sequential attack chains. They will appear here as vertical swimlanes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
      {chains.map((chain) => {
        const chainElements = chain.elements
          .map(id => elements.find(e => e.id === id))
          .filter(Boolean) as typeof elements;

        if (chainElements.length === 0) return null;

        return (
          <div key={chain.id} className="relative rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-card flex flex-col h-[70vh] min-h-[500px]">
            {/* Swimlane Header */}
            <div 
              className="px-5 py-3 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0"
              style={{ backgroundColor: `${chain.color}10` }}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: chain.color }} />
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] truncate">{chain.name}</h3>
              </div>
              <span className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider shrink-0">
                {chainElements.length} Steps
              </span>
            </div>

            {/* Swimlane Content (Vertical Scroll) */}
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex flex-col gap-3 pb-2">
                {chainElements.map((el, i) => {
                  const meta = TIER_META[el.tier];
                  const isLast = i === chainElements.length - 1;

                  return (
                    <div key={el.id} className="flex flex-col">
                      <div className="flex flex-col">
                        {/* Step Label */}
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ 
                              color: meta.color, 
                              backgroundColor: `${meta.color}15`,
                              border: `1px solid ${meta.color}40`
                            }}
                          >
                            Step {i + 1}
                          </span>
                          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
                            {meta.name}
                          </span>
                        </div>
                        
                        {/* Card */}
                        <div className="flex-1">
                          <ElementCard element={el} mode={mode} onEdit={() => {}} />
                        </div>
                      </div>

                      {/* Arrow Connector */}
                      {!isLast && (
                        <div className="flex justify-center py-2 relative h-10 w-full shrink-0">
                          <div className="w-0.5 h-full" style={{ backgroundColor: chain.color, opacity: 0.4 }} />
                          <div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--bg-surface)]"
                            style={{ 
                              width: '24px', 
                              height: '24px',
                              backgroundColor: chain.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
