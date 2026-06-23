"use client";

import { PlanElement } from "@/types";
import { TIER_META } from "@/lib/oakoc";
import { BriefMode } from "@/store/useBriefingStore";
import { ShieldAlert, Crosshair } from "lucide-react";

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
  const isHot = kev.length > 0 || maxEpss >= 0.8;
  const isPlan = mode === "plan";

  const Wrapper: any = isPlan ? "button" : "div";

  return (
    <Wrapper
      {...(isPlan
        ? { onClick: () => onEdit(element.id), type: "button", title: "Edit element" }
        : {})}
      className={`group relative text-left w-full overflow-hidden rounded-lg border bg-[var(--bg-surface)] shadow-card transition-colors ${
        isPlan ? "hover:border-[var(--accent-primary)] cursor-pointer" : "cursor-default"
      } border-[var(--border-default)]`}
      style={isHot ? { borderColor: `${DANGER}55` } : undefined}
    >
      {/* tier color spine */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: meta.color }}
        aria-hidden
      />

      <div className={isPlan ? "pl-4 pr-3 py-3" : "pl-5 pr-4 py-4"}>
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`font-semibold text-[var(--text-primary)] leading-snug transition-colors ${
              isPlan ? "text-[13px] group-hover:text-[var(--accent-primary)]" : "text-[15px]"
            }`}
          >
            {element.name}
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
      </div>
    </Wrapper>
  );
}
