"use client";

import { useBriefingStore } from "@/store/useBriefingStore";
import { TIER_ORDER, TIER_META } from "@/lib/oakoc";
import { ThreatTier } from "@/types";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Line {
  id: string;
  start: Point;
  end: Point;
  color: string;
}

export default function ChainBuilderView() {
  const { elements, chains, addChain } = useBriefingStore();
  const [lines, setLines] = useState<Line[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const calculateLines = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: Line[] = [];

    chains.forEach(chain => {
      for (let i = 0; i < chain.elements.length - 1; i++) {
        const startId = chain.elements[i];
        const endId = chain.elements[i + 1];

        const startNode = nodeRefs.current[startId];
        const endNode = nodeRefs.current[endId];

        if (startNode && endNode) {
          const startRect = startNode.getBoundingClientRect();
          const endRect = endNode.getBoundingClientRect();

          // Calculate center points relative to container
          const startX = startRect.left + startRect.width / 2 - containerRect.left;
          const startY = startRect.top + startRect.height / 2 - containerRect.top;
          const endX = endRect.left + endRect.width / 2 - containerRect.left;
          const endY = endRect.top + endRect.height / 2 - containerRect.top;

          newLines.push({
            id: `${chain.id}-${startId}-${endId}`,
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            color: chain.color
          });
        }
      }
    });

    setLines(newLines);
  };

  useEffect(() => {
    calculateLines();
    window.addEventListener("resize", calculateLines);
    return () => window.removeEventListener("resize", calculateLines);
  }, [chains, elements]);

  // Re-calculate lines when scroll happens inside the columns
  useEffect(() => {
    const handleScroll = () => calculateLines();
    const columns = document.querySelectorAll('.builder-column');
    columns.forEach(col => col.addEventListener('scroll', handleScroll));
    return () => columns.forEach(col => col.removeEventListener('scroll', handleScroll));
  }, [elements]);


  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedId(elementId);
    e.dataTransfer.setData("text/plain", elementId);
    e.dataTransfer.effectAllowed = "link";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "link";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    
    if (sourceId && sourceId !== targetId) {
      const sourceEl = elements.find(el => el.id === sourceId);
      const targetEl = elements.find(el => el.id === targetId);
      
      if (sourceEl && targetEl) {
        const id = `chain-${Date.now()}`;
        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
        const color = colors[chains.length % colors.length];
        
        addChain({
          id,
          name: `${sourceEl.name} -> ${targetEl.name}`,
          color,
          elements: [sourceId, targetId]
        });
      }
    }
    setDraggedId(null);
  };

  return (
    <div className="relative w-full h-[75vh] min-h-[600px] border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface)] overflow-x-auto shadow-card">
      <div 
        className="relative min-w-[800px] w-full h-full flex"
        ref={containerRef}
      >
        {/* SVG Overlay for Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            {chains.map(c => (
              <marker
                key={`arrow-${c.id}`}
                id={`arrow-${c.id}`}
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={c.color} />
              </marker>
            ))}
          </defs>
          {lines.map(line => {
            // Calculate Bezier curve control points for a smooth flow (left to right)
            // Actually, since columns can be adjacent or far away, an S-curve is nice.
            const dx = Math.abs(line.end.x - line.start.x);
            const cpX = dx * 0.4;
            
            return (
              <path
                key={line.id}
                d={`M ${line.start.x} ${line.start.y} C ${line.start.x + cpX} ${line.start.y}, ${line.end.x - cpX} ${line.end.y}, ${line.end.x} ${line.end.y}`}
                fill="none"
                stroke={line.color}
                strokeWidth="2.5"
                strokeOpacity="0.7"
                markerEnd={`url(#arrow-${line.id.split('-')[0]})`}
                className="drop-shadow-sm transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Columns */}
        <div className="flex w-full h-full divide-x divide-[var(--border-subtle)]">
        {TIER_ORDER.map(tier => {
          const tierElements = elements.filter(e => e.tier === tier);
          const meta = TIER_META[tier];

          return (
            <div key={tier} className="flex-1 flex flex-col min-w-0 builder-column overflow-y-auto custom-scrollbar relative z-20">
              <div className="sticky top-0 p-3 bg-[var(--bg-surface)]/95 backdrop-blur-sm border-b border-[var(--border-subtle)] shadow-sm z-30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: meta.color }} />
                  <h3 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">{meta.short}</h3>
                </div>
              </div>
              
              <div className="p-4 flex flex-col gap-4 min-h-max">
                {tierElements.length === 0 ? (
                  <div className="text-center py-6 text-[11px] text-[var(--text-muted)] italic">No elements</div>
                ) : (
                  tierElements.map(el => {
                    const isFramework = el.nature === "framework";
                    
                    return (
                      <div
                        key={el.id}
                        ref={elRef => { nodeRefs.current[el.id] = elRef; }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, el.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, el.id)}
                        className={`group relative p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing bg-[var(--bg-base)] transition-all ${
                          draggedId === el.id ? "opacity-50 scale-95" : "hover:border-[var(--accent-primary)] hover:shadow-md"
                        } ${isFramework ? "border-dashed opacity-90" : "border-solid"} border-[var(--border-default)]`}
                      >
                        {/* Drag Handle Indicator */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--bg-raised)] border border-[var(--border-default)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm cursor-crosshair">
                          <Plus className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                        </div>
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--bg-raised)] border border-[var(--border-default)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm cursor-crosshair">
                          <Plus className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-[var(--text-primary)] leading-tight">{el.name}</span>
                          {isFramework && (
                            <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mt-1">Theory</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
