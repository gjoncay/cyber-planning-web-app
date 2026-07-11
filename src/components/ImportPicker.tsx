"use client";

import { useEffect, useRef, useState } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import {
  searchDetections,
  searchMitigations,
  searchDataComponents,
  searchAnalytics,
  DetectionStrategy,
  Mitigation,
  DataComponent,
  Analytic,
} from "@/lib/api";
import { searchSoftware } from "@/lib/api";
import { AttackSoftware, tierForSoftware } from "@/lib/attack";
import { PlanElement } from "@/types";
import ModalShell from "./ModalShell";
import {
  Search,
  RefreshCw,
  Radar,
  ShieldCheck,
  Database,
  LineChart,
  Bug,
  DownloadCloud,
  X,
  type LucideIcon,
} from "lucide-react";

export type PickerType = "detection" | "mitigation" | "datacomponent" | "analytic" | "software";

/** Normalized row rendering for any library item. */
interface DisplayRow {
  id: string;
  title: string;
  meta?: string;
  description?: string;
}

interface PickerConfig {
  label: string; // segmented-control label
  title: string;
  subtitle: string;
  icon: LucideIcon;
  nounSingular: string;
  nounPlural: string;
  placeholder: string;
  search: (q: string) => Promise<unknown[]>;
  toDisplay: (item: unknown) => DisplayRow;
  mapToElement: (item: unknown) => PlanElement;
}

const CONFIGS: Record<PickerType, PickerConfig> = {
  detection: {
    label: "Detections",
    title: "Import Detection Strategies",
    subtitle: "Select MITRE detection strategies to pre-fill the Observation layer.",
    icon: Radar,
    nounSingular: "strategy",
    nounPlural: "strategies",
    placeholder: "Search detection strategies — e.g. Abuse of Domain Accounts",
    search: searchDetections,
    toDisplay: (raw) => {
      const det = raw as DetectionStrategy;
      return { id: det.id, title: det.name, meta: det.domain };
    },
    mapToElement: (raw) => {
      const det = raw as DetectionStrategy;
      return {
        id: `det-${det.id.toLowerCase()}`,
        name: det.name,
        nature: "framework",
        tier: "observation",
        cves: [],
        detections: [{ id: det.id, name: det.name }],
        description: `Domain: ${det.domain}`,
      };
    },
  },
  mitigation: {
    label: "Mitigations",
    title: "Import Mitigations",
    subtitle: "Select MITRE mitigations to pre-fill the Obstacles layer.",
    icon: ShieldCheck,
    nounSingular: "mitigation",
    nounPlural: "mitigations",
    placeholder: "Search mitigations — e.g. Multi-factor Authentication",
    search: searchMitigations,
    toDisplay: (raw) => {
      const mit = raw as Mitigation;
      return { id: mit.id, title: mit.name, description: mit.description };
    },
    mapToElement: (raw) => {
      const mit = raw as Mitigation;
      return {
        id: `mit-${mit.id.toLowerCase()}`,
        name: mit.name,
        nature: "framework",
        tier: "obstacle",
        cves: [],
        mitigations: [{ id: mit.id, name: mit.name }],
        description: mit.description,
      };
    },
  },
  datacomponent: {
    label: "Data Components",
    title: "Import Data Components",
    subtitle: "Select MITRE data components to pre-fill the Observation layer.",
    icon: Database,
    nounSingular: "component",
    nounPlural: "components",
    placeholder: "Search data components — e.g. Process Creation",
    search: searchDataComponents,
    toDisplay: (raw) => {
      const dc = raw as DataComponent;
      return { id: dc.id, title: dc.name, meta: dc.domain, description: dc.description };
    },
    mapToElement: (raw) => {
      const dc = raw as DataComponent;
      return {
        id: `dc-${dc.id.toLowerCase()}`,
        name: dc.name,
        nature: "framework",
        tier: "observation",
        cves: [],
        datacomponents: [{ id: dc.id, name: dc.name }],
        description: `Domain: ${dc.domain}\n\n${dc.description}`,
      };
    },
  },
  analytic: {
    label: "Analytics",
    title: "Import Analytics",
    subtitle: "Select MITRE analytics to pre-fill the Observation layer.",
    icon: LineChart,
    nounSingular: "analytic",
    nounPlural: "analytics",
    placeholder: "Search analytics — e.g. AN0001",
    search: searchAnalytics,
    toDisplay: (raw) => {
      const an = raw as Analytic;
      return {
        id: an.id,
        title: `Analytic: ${an.id}`,
        meta: [an.platform, an.domain].filter(Boolean).join(" · "),
        description: an.description,
      };
    },
    mapToElement: (raw) => {
      const an = raw as Analytic;
      return {
        id: `an-${an.id.toLowerCase()}`,
        name: `Analytic: ${an.id}`,
        nature: "framework",
        tier: "observation",
        cves: [],
        analytics: [{ id: an.id, name: `Analytic: ${an.id}` }],
        description: `${an.description}\n\nPlatform: ${an.platform}\nDomain: ${an.domain}${an.relatedDetection ? `\nRelated Detection: ${an.relatedDetection}` : ""}`,
      };
    },
  },
  software: {
    label: "Software",
    title: "Import Software",
    subtitle: "Select MITRE software (malware/tools) — placed by its ATT&CK tactics.",
    icon: Bug,
    nounSingular: "software item",
    nounPlural: "software items",
    placeholder: "Search software — e.g. Cobalt Strike, Mimikatz",
    search: searchSoftware,
    toDisplay: (raw) => {
      const sw = raw as AttackSoftware;
      return {
        id: sw.id,
        title: sw.name,
        meta: [sw.type, sw.platforms?.slice(0, 3).join(", ")].filter(Boolean).join(" · "),
        description: sw.description,
      };
    },
    mapToElement: (raw) => {
      const sw = raw as AttackSoftware;
      return {
        id: `sw-${sw.id.toLowerCase()}`,
        name: sw.name,
        nature: "tangible",
        tier: tierForSoftware(sw),
        cves: [],
        software: [{ id: sw.id, name: sw.name }],
        description: `${sw.description}\n\nType: ${sw.type}\nPlatforms: ${sw.platforms.join(", ")}`,
      };
    },
  },
};

const PICKER_TYPES: PickerType[] = ["detection", "mitigation", "datacomponent", "analytic", "software"];

interface ImportPickerProps {
  onClose: () => void;
  initialType?: PickerType;
}

/**
 * One generic "Add from library" picker replacing the five near-identical
 * Import* modals, parameterized by a type facet (segmented control).
 */
export default function ImportPicker({ onClose, initialType = "detection" }: ImportPickerProps) {
  const upsertElements = useBriefingStore((s) => s.upsertElements);

  const [type, setType] = useState<PickerType>(initialType);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<unknown[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef("");

  const config = CONFIGS[type];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    const key = `${type}:${q}`;
    requestRef.current = key;

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await CONFIGS[type].search(q);
      if (requestRef.current !== key) return;
      setResults(r);
      setSearching(false);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, type]);

  const switchType = (t: PickerType) => {
    setType(t);
    setQuery("");
    setResults([]);
    setSelected(new Set());
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const doImport = () => {
    if (selected.size === 0) return;
    const items = results.filter((r) => selected.has(config.toDisplay(r).id));
    upsertElements(items.map((item) => config.mapToElement(item)));
    onClose();
  };

  const Icon = config.icon;
  const noun = selected.size === 1 ? config.nounSingular : config.nounPlural;

  return (
    <ModalShell
      onClose={onClose}
      label={config.title}
      panelClassName="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--accent-primary)]" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">{config.title}</h2>
            <p className="text-[11px] text-[var(--text-muted)]">{config.subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 hover:bg-[var(--bg-raised)] rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Type facet — segmented control over the five library types */}
      <div className="px-5 pt-4 shrink-0">
        <div
          role="tablist"
          aria-label="Library type"
          className="inline-flex flex-wrap items-center p-1 bg-[var(--bg-raised)] rounded-lg border border-[var(--border-default)]"
        >
          {PICKER_TYPES.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={type === t}
              onClick={() => switchType(t)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                type === t
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
              }`}
            >
              {CONFIGS[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 overflow-y-auto flex-1">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={config.placeholder}
            className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[var(--border-default)] bg-[var(--bg-base)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {searching && (
            <div className="flex items-center gap-1.5 px-1 py-2 text-[12px] text-[var(--text-muted)]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Searching…
            </div>
          )}
          {!searching && results.length === 0 && (
            <div className="px-1 py-2 text-[12px] text-[var(--text-muted)]">
              No {config.nounPlural} match.
            </div>
          )}
          {!searching &&
            results.map((raw) => {
              const row = config.toDisplay(raw);
              const on = selected.has(row.id);
              return (
                <label
                  key={row.id}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-md border cursor-pointer transition-colors"
                  style={{
                    borderColor: on ? "var(--accent-primary)" : "var(--border-default)",
                    background: on ? "var(--bg-raised)" : "var(--bg-surface)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(row.id)}
                    className="mt-1 accent-[var(--accent-primary)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-[var(--text-primary)]">{row.title}</span>
                      <span className="mono text-[11px] text-[var(--text-muted)]">{row.id}</span>
                      {row.meta && (
                        <span className="ml-auto text-[11px] text-[var(--text-muted)] tabular-nums truncate max-w-[40%]">
                          {row.meta}
                        </span>
                      )}
                    </div>
                    {row.description && (
                      <p className="mt-1 text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                        {row.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-raised)] flex items-center justify-between shrink-0">
        <span className="text-[11px] text-[var(--text-muted)]">
          {selected.size} {noun} selected
        </span>
        <button
          onClick={doImport}
          disabled={selected.size === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-[var(--text-inverse)] bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <DownloadCloud className="h-3.5 w-3.5" />
          Import {selected.size} {noun}
        </button>
      </div>
    </ModalShell>
  );
}
