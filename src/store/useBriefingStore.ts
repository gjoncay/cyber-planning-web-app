import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PlanElement, ThreatTier, TechniqueRef } from "@/types";
import { fetchThreatIntelligence } from "@/lib/api";

export type BriefMode = "plan" | "brief";

interface BriefingState {
  elements: PlanElement[];
  mode: BriefMode;
  selectedId: string | null;

  setMode: (mode: BriefMode) => void;
  setSelectedId: (id: string | null) => void;
  addElement: (element: PlanElement) => void;
  updateElement: (id: string, data: Partial<PlanElement>) => void;
  deleteElement: (id: string) => void;
  enrichElement: (id: string) => Promise<void>;
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
      mode: "plan",
      selectedId: null,

      setMode: (mode) => set({ mode }),
      setSelectedId: (id) => set({ selectedId: id }),

      addElement: (element) => set((s) => ({ elements: [...s.elements, element] })),

      updateElement: (id, data) =>
        set((s) => ({
          elements: s.elements.map((el) => (el.id === id ? { ...el, ...data } : el)),
        })),

      deleteElement: (id) =>
        set((s) => ({
          elements: s.elements.filter((el) => el.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      enrichElement: async (id) => {
        const el = get().elements.find((e) => e.id === id);
        if (!el || el.cves.length === 0) return;
        const metrics = await fetchThreatIntelligence(el.cves);
        get().updateElement(id, { metrics, lastEnriched: new Date().toISOString() });
      },
    }),
    {
      name: "cyber-sandbox-oakoc-v3",
      skipHydration: true,
    },
  ),
);
