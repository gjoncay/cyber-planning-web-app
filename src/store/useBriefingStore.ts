import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PlanElement, ThreatTier, TechniqueRef, AttackChain } from "@/types";
import { fetchThreatIntelligence } from "@/lib/api";
import { metricsKnown } from "@/lib/severity";

export type BriefMode = "guide" | "plan" | "brief";

/** Pre-destruction snapshot backing the 10-second "Undo" toast. */
export interface PlanSnapshot {
  elements: PlanElement[];
  chains: AttackChain[];
  /** What was destroyed, for the toast copy — e.g. "Cleared all elements". */
  label: string;
  /** When the destructive action happened (ms epoch) — drives toast expiry. */
  at: number;
}

interface BriefingState {
  elements: PlanElement[];
  chains: AttackChain[];
  mode: BriefMode;
  selectedId: string | null;
  lastSnapshot: PlanSnapshot | null;

  setMode: (mode: BriefMode) => void;
  setSelectedId: (id: string | null) => void;
  addElement: (element: PlanElement) => void;
  updateElement: (id: string, data: Partial<PlanElement>) => void;
  deleteElement: (id: string) => void;
  clearTier: (tier: ThreatTier) => void;
  clearAll: () => void;
  upsertElements: (elements: PlanElement[]) => void;
  /** Restore elements + chains from the last destructive action's snapshot. */
  undoLast: () => void;
  dismissSnapshot: () => void;
  /** Merge an imported plan file (elements merged, chains deduped by id). */
  importPlanData: (elements: PlanElement[], chains: AttackChain[]) => void;
  /**
   * Replace the whole working plan (scenario switch). Callers are responsible
   * for snapshotting the outgoing plan into the scenario registry first.
   */
  replacePlan: (elements: PlanElement[], chains: AttackChain[]) => void;

  // Chain management
  addChain: (chain: AttackChain) => void;
  updateChain: (id: string, data: Partial<AttackChain>) => void;
  deleteChain: (id: string) => void;
  toggleElementInChain: (chainId: string, elementId: string) => void;

  enrichElement: (id: string) => Promise<void>;
}

/** True for "empty" incoming values that must not clobber user edits. */
const isEmptyValue = (v: unknown): boolean =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

/** Union two ref lists by id, keeping the existing entries' names. */
function mergeRefs<T extends { id: string }>(existing: T[] | undefined, incoming: T[] | undefined): T[] | undefined {
  if (!existing?.length) return incoming;
  if (!incoming?.length) return existing;
  const map = new Map(existing.map((r) => [r.id, r]));
  for (const r of incoming) if (!map.has(r.id)) map.set(r.id, r);
  return [...map.values()];
}

/**
 * Merge an incoming element into an existing one without destroying user
 * edits: existing scalar fields win unless empty; list fields are unioned;
 * metrics are combined (fresh intel fills gaps, never wipes).
 */
function mergeElement(existing: PlanElement, incoming: PlanElement): PlanElement {
  return {
    ...existing,
    name: isEmptyValue(existing.name) ? incoming.name : existing.name,
    nature: existing.nature ?? incoming.nature,
    tier: existing.tier ?? incoming.tier,
    description: isEmptyValue(existing.description) ? incoming.description : existing.description,
    cves: [...new Set([...(existing.cves ?? []), ...(incoming.cves ?? [])])],
    techniques: mergeRefs(existing.techniques, incoming.techniques),
    detections: mergeRefs(existing.detections, incoming.detections),
    mitigations: mergeRefs(existing.mitigations, incoming.mitigations),
    datacomponents: mergeRefs(existing.datacomponents, incoming.datacomponents),
    analytics: mergeRefs(existing.analytics, incoming.analytics),
    software: mergeRefs(existing.software, incoming.software),
    d3fend: mergeRefs(existing.d3fend, incoming.d3fend),
    metrics: existing.metrics || incoming.metrics ? { ...incoming.metrics, ...existing.metrics } : undefined,
  };
}

/** Merge incoming elements into the current list — never silently overwrite. */
function mergeElements(current: PlanElement[], incoming: PlanElement[]): PlanElement[] {
  const map = new Map(current.map((el) => [el.id, el]));
  for (const el of incoming) {
    const existing = map.get(el.id);
    map.set(el.id, existing ? mergeElement(existing, el) : el);
  }
  return [...map.values()];
}

const seed = (
  id: string,
  name: string,
  tier: ThreatTier,
  description: string,
  cves: string[] = [],
  techniques: TechniqueRef[] = [],
): PlanElement => ({ id, name, tier, description, cves, techniques });

const INITIAL_ELEMENTS: PlanElement[] = [
  seed(
    "edge-vpn",
    "Edge Firewall / VPN Gateway",
    "avenue-of-approach",
    "Public Citrix gateway. Citrix Bleed let an attacker hijack active employee sessions, then move laterally over SMB.",
    ["CVE-2023-3519", "CVE-2023-4966"],
    [
      { id: "T1133", name: "External Remote Services" },
      { id: "T1021.002", name: "SMB / Windows Admin Shares" },
    ],
  ),
  seed(
    "dns-tunnel",
    "DNS Tunneling Channel",
    "cover-concealment",
    "Adversary runs implants in memory and encodes exfiltration inside outbound DNS queries to stay hidden.",
    [],
    [
      { id: "T1071.004", name: "Application Layer Protocol: DNS" },
      { id: "T1055", name: "Process Injection" },
    ],
  ),
  seed(
    "ad-domain-controller",
    "Active Directory Domain Controller",
    "key-terrain",
    "Corporate authentication and access controller. Zerologon would hand an attacker domain-admin privileges.",
    ["CVE-2020-1472"],
    [{ id: "T1003.006", name: "OS Credential Dumping: DCSync" }],
  ),
  seed(
    "edr-telemetry",
    "EDR Logs Telemetry",
    "observation",
    "Endpoint detection logs on critical workstations. Flags abnormal behavior, but telemetry is not yet aggregated centrally.",
  ),
  seed(
    "ngfw-segmentation",
    "NGFW Segmentation Rules",
    "obstacle",
    "Next-gen firewall policy limiting traffic from the VPN subnet to directory databases — the principal defensive hurdle.",
  ),
];

export const useBriefingStore = create<BriefingState>()(
  persist(
    (set, get) => ({
      elements: INITIAL_ELEMENTS,
      chains: [],
      mode: "plan",
      selectedId: null,
      lastSnapshot: null,

      setMode: (mode) => set({ mode }),
      setSelectedId: (id) => set({ selectedId: id }),

      addElement: (element) => set((s) => ({ elements: [...s.elements, element] })),

      updateElement: (id, data) =>
        set((s) => ({
          elements: s.elements.map((el) => (el.id === id ? { ...el, ...data } : el)),
        })),

      deleteElement: (id) =>
        set((s) => {
          const target = s.elements.find((el) => el.id === id);
          return {
            lastSnapshot: snapshot(s, target ? `Deleted "${target.name}"` : "Deleted element"),
            elements: s.elements.filter((el) => el.id !== id),
            chains: s.chains.map(c => ({ ...c, elements: c.elements.filter(eid => eid !== id) })),
            selectedId: s.selectedId === id ? null : s.selectedId,
          };
        }),

      clearTier: (tier) =>
        set((s) => {
          const removedIds = new Set(s.elements.filter((el) => el.tier === tier).map((el) => el.id));
          return {
            lastSnapshot: snapshot(s, `Cleared ${removedIds.size} element${removedIds.size === 1 ? "" : "s"}`),
            elements: s.elements.filter((el) => el.tier !== tier),
            chains: s.chains.map(c => ({ ...c, elements: c.elements.filter(eid => !removedIds.has(eid)) })),
            selectedId: s.selectedId && removedIds.has(s.selectedId) ? null : s.selectedId,
          };
        }),

      clearAll: () =>
        set((s) => ({
          lastSnapshot: snapshot(s, "Cleared all elements"),
          elements: [],
          chains: [],
          selectedId: null,
        })),

      // Bulk add — used by the library/adversary imports. Merges by id so a
      // re-import never silently overwrites user-edited elements.
      upsertElements: (incoming) =>
        set((s) => ({ elements: mergeElements(s.elements, incoming) })),

      undoLast: () =>
        set((s) => {
          if (!s.lastSnapshot) return s;
          return {
            elements: s.lastSnapshot.elements,
            chains: s.lastSnapshot.chains,
            lastSnapshot: null,
          };
        }),

      dismissSnapshot: () => set({ lastSnapshot: null }),

      replacePlan: (elements, chains) =>
        set({ elements, chains, selectedId: null, lastSnapshot: null }),

      importPlanData: (elements, chains) =>
        set((s) => {
          const known = new Set(s.chains.map((c) => c.id));
          return {
            elements: mergeElements(s.elements, elements),
            chains: [...s.chains, ...chains.filter((c) => !known.has(c.id))],
          };
        }),

      addChain: (chain) => set((s) => ({ chains: [...s.chains, chain] })),
      updateChain: (id, data) =>
        set((s) => ({
          chains: s.chains.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteChain: (id) =>
        set((s) => {
          const target = s.chains.find((c) => c.id === id);
          return {
            lastSnapshot: snapshot(s, target ? `Deleted chain "${target.name}"` : "Deleted chain"),
            chains: s.chains.filter((c) => c.id !== id),
          };
        }),
      toggleElementInChain: (chainId, elementId) =>
        set((s) => ({
          chains: s.chains.map((c) => {
            if (c.id !== chainId) return c;
            const has = c.elements.includes(elementId);
            return {
              ...c,
              elements: has ? c.elements.filter(id => id !== elementId) : [...c.elements, elementId]
            };
          })
        })),

      enrichElement: async (id) => {
        const el = get().elements.find((e) => e.id === id);
        if (!el || el.cves.length === 0) return;
        const metrics = await fetchThreatIntelligence(el.cves);
        const succeeded = Object.values(metrics).every((m) => metricsKnown(m));
        // Keep the (possibly "unknown") metrics so the UI can show an honest
        // "enrichment unavailable" state, but only stamp lastEnriched on
        // success so the next save retries the lookup.
        get().updateElement(
          id,
          succeeded ? { metrics, lastEnriched: new Date().toISOString() } : { metrics },
        );
      },
    }),
    {
      name: "cyber-sandbox-oakoc-v3",
      version: 4,
      // v0–3 states carry the same shape this app already reads (new fields
      // are optional), so migration is a pass-through today — but having
      // version + migrate in place means future schema changes can transform
      // old data instead of orphaning the "…-v3" storage key.
      migrate: (persisted) => persisted as BriefingState,
      partialize: (s) =>
        ({ elements: s.elements, chains: s.chains, mode: s.mode }) as BriefingState,
      skipHydration: true,
    },
  ),
);

/** Capture the pre-destruction state for undo. */
function snapshot(s: Pick<BriefingState, "elements" | "chains">, label: string): PlanSnapshot {
  return { elements: s.elements, chains: s.chains, label, at: Date.now() };
}
