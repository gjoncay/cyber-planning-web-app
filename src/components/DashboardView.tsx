"use client";

import { useBriefingStore } from "@/store/useBriefingStore";
import { ShieldAlert, Crosshair, Radar, ShieldCheck, Database, LineChart, Bug, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { useMemo } from "react";

export default function DashboardView() {
  const { chains, elements } = useBriefingStore();

  const metrics = useMemo(() => {
    let activeKev = 0;
    let highEpss = 0;
    let totalCves = 0;
    let unmitigatedChains = 0;
    let undetectedChains = 0;

    elements.forEach(el => {
      totalCves += el.cves.length;
      const kev = el.cves.filter((c) => el.metrics?.[c]?.isExploited);
      if (kev.length > 0) activeKev += kev.length;
      
      const maxEpss = el.cves.reduce((max, cve) => {
        // mock epss calculation matching ElementCard
        const num = parseInt(cve.replace(/\D/g, "").slice(-4) || "0", 10);
        const rand = (num % 100) / 100;
        return Math.max(max, rand);
      }, 0);
      
      if (maxEpss >= 0.8) highEpss++;
    });

    chains.forEach(chain => {
      const chainElements = chain.elements.map(id => elements.find(e => e.id === id)).filter(Boolean) as typeof elements;
      const hasMitigation = chainElements.some(el => el.tier === "obstacle");
      const hasDetection = chainElements.some(el => el.tier === "observation");
      
      if (!hasMitigation) unmitigatedChains++;
      if (!hasDetection) undetectedChains++;
    });

    return { activeKev, highEpss, totalCves, unmitigatedChains, undetectedChains };
  }, [elements, chains]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <Activity className="w-4 h-4 text-[var(--accent-secondary)]" />
            <h4 className="text-[13px] font-semibold uppercase tracking-wider">Total Scenarios</h4>
          </div>
          <span className="text-3xl font-bold text-[var(--text-primary)]">{chains.length}</span>
        </div>
        
        <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <ShieldAlert className="w-4 h-4 text-[#ef4444]" />
            <h4 className="text-[13px] font-semibold uppercase tracking-wider">Active KEVs</h4>
          </div>
          <span className="text-3xl font-bold text-[#ef4444]">{metrics.activeKev}</span>
          <p className="text-[11px] text-[var(--text-muted)]">Known exploited vulnerabilities</p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
            <h4 className="text-[13px] font-semibold uppercase tracking-wider">High Risk EPSS</h4>
          </div>
          <span className="text-3xl font-bold text-[#f59e0b]">{metrics.highEpss}</span>
          <p className="text-[11px] text-[var(--text-muted)]">EPSS probability &gt; 80%</p>
        </div>
        
        <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-primary)]" />
            <h4 className="text-[13px] font-semibold uppercase tracking-wider">Total Elements</h4>
          </div>
          <span className="text-3xl font-bold text-[var(--text-primary)]">{elements.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage Matrix */}
        <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Defensive Coverage</h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[var(--bg-raised)] flex items-center justify-between border border-[var(--border-subtle)]">
              <div>
                <h4 className="font-semibold text-[var(--text-primary)]">Unmitigated Scenarios</h4>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1">Attack chains missing Obstacle elements.</p>
              </div>
              <span className={`text-2xl font-bold ${metrics.unmitigatedChains > 0 ? "text-[#ef4444]" : "text-[var(--accent-secondary)]"}`}>
                {metrics.unmitigatedChains}
              </span>
            </div>
            
            <div className="p-4 rounded-lg bg-[var(--bg-raised)] flex items-center justify-between border border-[var(--border-subtle)]">
              <div>
                <h4 className="font-semibold text-[var(--text-primary)]">Undetected Scenarios</h4>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1">Attack chains missing Observation elements.</p>
              </div>
              <span className={`text-2xl font-bold ${metrics.undetectedChains > 0 ? "text-[#f59e0b]" : "text-[var(--accent-secondary)]"}`}>
                {metrics.undetectedChains}
              </span>
            </div>
          </div>
        </div>

        {/* Threat Summary */}
        <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Scenario Breakdown</h3>
          
          {chains.length === 0 ? (
            <div className="text-[13px] text-[var(--text-muted)] italic text-center py-8">
              No scenarios defined.
            </div>
          ) : (
            <div className="space-y-3">
              {chains.map(chain => {
                const chainElements = chain.elements.map(id => elements.find(e => e.id === id)).filter(Boolean) as typeof elements;
                const hasMitigation = chainElements.some(el => el.tier === "obstacle");
                const hasDetection = chainElements.some(el => el.tier === "observation");
                
                return (
                  <div key={chain.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-raised)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chain.color }} />
                      <span className="font-semibold text-[var(--text-primary)] text-[14px]">{chain.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span 
                        className="text-[10px] font-bold px-2 py-1 rounded border uppercase"
                        style={{ 
                          color: hasDetection ? "var(--text-inverse)" : "var(--text-primary)",
                          backgroundColor: hasDetection ? "var(--accent-primary)" : "transparent",
                          borderColor: hasDetection ? "transparent" : "var(--border-strong)"
                        }}
                      >
                        {hasDetection ? "Detected" : "Blind"}
                      </span>
                      <span 
                        className="text-[10px] font-bold px-2 py-1 rounded border uppercase"
                        style={{ 
                          color: hasMitigation ? "var(--text-inverse)" : "var(--text-primary)",
                          backgroundColor: hasMitigation ? "var(--accent-secondary)" : "transparent",
                          borderColor: hasMitigation ? "transparent" : "var(--border-strong)"
                        }}
                      >
                        {hasMitigation ? "Mitigated" : "Exposed"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
