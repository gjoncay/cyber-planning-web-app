import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CustomNode, CustomEdge, CustomNodeData, ThreatTier, VulnerabilityMetrics } from "@/types";
import { fetchThreatIntelligence, calculateFinancialRisk } from "@/lib/api";

interface BriefingState {
  nodes: CustomNode[];
  edges: CustomEdge[];
  markdownText: string;
  viewMode: "tactical" | "strategic";
  selectedNodeId: string | null;
  
  // Actions
  setNodes: (nodes: CustomNode[] | ((nodes: CustomNode[]) => CustomNode[])) => void;
  setEdges: (edges: CustomEdge[] | ((edges: CustomEdge[]) => CustomEdge[])) => void;
  addNode: (node: CustomNode) => void;
  updateNode: (nodeId: string, data: Partial<CustomNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  addEdge: (edge: CustomEdge) => void;
  deleteEdge: (edgeId: string) => void;
  setMarkdownText: (text: string) => void;
  setViewMode: (mode: "tactical" | "strategic") => void;
  setSelectedNodeId: (id: string | null) => void;
  
  // Async API Enrichment Actions
  fetchApiDataForNode: (nodeId: string) => Promise<void>;
  fetchApiDataForAllNodes: () => Promise<void>;
}

const INITIAL_NODES: CustomNode[] = [
  {
    id: "obs-edr",
    type: "customThreatNode",
    position: { x: 250, y: 50 },
    data: {
      id: "obs-edr",
      name: "EDR Logs Telemetry",
      ips: ["192.168.10.22"],
      cves: [],
      tier: "observation",
      description: "Host Endpoint Detection & Response logs monitoring critical workstations. Flagged abnormal behavior but telemetry remains unaggregated.",
      sigmaRules: ["Workstation credential dumping detection"],
      lossMagnitude: 10000,
      financialRisk: 10,
    },
  },
  {
    id: "ave-vpn",
    type: "customThreatNode",
    position: { x: 250, y: 180 },
    data: {
      id: "ave-vpn",
      name: "Edge Firewall / VPN Gateway",
      ips: ["192.168.10.15"],
      cves: ["CVE-2023-3519", "CVE-2023-4966"],
      tier: "avenue-of-approach",
      description: "Public Citrix Gateway server. Attacker leveraged Citrix Bleed to hijack active employee sessions and gain network access.",
      sigmaRules: ["Citrix Session Hijacking Detection"],
      lossMagnitude: 50000,
      financialRisk: 50,
    },
  },
  {
    id: "obs-firewall",
    type: "customThreatNode",
    position: { x: 250, y: 310 },
    data: {
      id: "obs-firewall",
      name: "NGFW Segmentation Rules",
      ips: [],
      cves: [],
      tier: "obstacle",
      description: "Internal Next-Gen Firewall policy limiting traffic from VPN subnet to directory databases. Serves as our principal defense hurdle.",
      sigmaRules: ["DMZ outbound connection attempts"],
      lossMagnitude: 100000,
      financialRisk: 100,
    },
  },
  {
    id: "key-ad",
    type: "customThreatNode",
    position: { x: 250, y: 440 },
    data: {
      id: "key-ad",
      name: "Active Directory Domain DC",
      ips: ["10.0.1.5"],
      cves: ["CVE-2020-1472"],
      tier: "key-terrain",
      description: "Corporate authentication and access controller. Attacker exploited Zerologon to compromise admin privileges.",
      sigmaRules: ["Zerologon Exploit Attempt"],
      lossMagnitude: 1000000,
      financialRisk: 1000,
    },
  },
  {
    id: "cov-dns",
    type: "customThreatNode",
    position: { x: 250, y: 570 },
    data: {
      id: "cov-dns",
      name: "DNS Tunneling Exfil Channel",
      ips: [],
      cves: [],
      tier: "cover-concealment",
      description: "Attacker encodes exfil files inside outbound DNS TXT requests, hiding traffic behind standard port 53 queries.",
      sigmaRules: ["Suspiciously large DNS query volumes"],
      lossMagnitude: 250000,
      financialRisk: 250,
    },
  },
];

const INITIAL_EDGES: CustomEdge[] = [
  {
    id: "edge-obs-to-ave",
    source: "obs-edr",
    target: "ave-vpn",
    animated: true,
    style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
  },
  {
    id: "edge-ave-to-obs",
    source: "ave-vpn",
    target: "obs-firewall",
    animated: true,
    style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
  },
  {
    id: "edge-obs-to-key",
    source: "obs-firewall",
    target: "key-ad",
    animated: true,
    style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
  },
  {
    id: "edge-key-to-cov",
    source: "key-ad",
    target: "cov-dns",
    animated: true,
    style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
  },
];

const INITIAL_MARKDOWN = `# Cyber Operations Plan: IPOE & OAKOC Assessment

This planning model assesses the terrain vulnerabilities of our internal directory databases against active campaigns.

## 1. Observation (Telemetry Coverage)
Our primary monitoring capability resides in our @Node(obs-edr) server. This log source provides deep system call monitoring but currently misses boundary proxy telemetry.

## 2. Avenues of Approach (Entry Vectors)
Attackers can traverse our perimeter via the public-facing @Node(ave-vpn). Recent threat intel shows threat groups targeting unpatched firmware with automated exploit tools to establish footholds.

## 3. Obstacles (Defensive Mitigations)
To restrict lateral movement, we deploy @Node(obs-firewall) rules. These obstacles are configured to block all incoming RDP connections unless validated by MFA, slowing down unauthorized pivot chains.

## 4. Key Terrain (Crown Jewels)
The adversary's target is the @Node(key-ad) server. Compromising this server gives the attacker Domain Admin privileges, allowing complete control over all internal assets.

## 5. Cover & Concealment (Adversary Evasion)
Once inside, the threat actor leverages @Node(cov-dns) techniques, hiding command-and-control payloads inside standard web/dns packets to bypass network telemetry and exfiltrate secrets.
`;

export const useBriefingStore = create<BriefingState>()(
  persist(
    (set, get) => ({
      nodes: INITIAL_NODES,
      edges: INITIAL_EDGES,
      markdownText: INITIAL_MARKDOWN,
      viewMode: "tactical",
      selectedNodeId: null,

      setNodes: (newNodes) =>
        set((state) => ({
          nodes: typeof newNodes === "function" ? newNodes(state.nodes) : newNodes,
        })),

      setEdges: (newEdges) =>
        set((state) => ({
          edges: typeof newEdges === "function" ? newEdges(state.edges) : newEdges,
        })),

      addNode: (node) =>
        set((state) => ({
          nodes: [...state.nodes, node],
        })),

      updateNode: (nodeId, data) =>
        set((state) => {
          const updatedNodes = state.nodes.map((node) => {
            if (node.id === nodeId) {
              const updatedData = { ...node.data, ...data };
              updatedData.financialRisk = calculateFinancialRisk(
                updatedData.cves,
                updatedData.tier,
                updatedData.metrics,
                updatedData.lossMagnitude
              );
              return { ...node, data: updatedData };
            }
            return node;
          });
          return { nodes: updatedNodes };
        }),

      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        })),

      addEdge: (edge) =>
        set((state) => ({
          edges: [...state.edges, edge],
        })),

      deleteEdge: (edgeId) =>
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
        })),

      setMarkdownText: (text) => set({ markdownText: text }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      fetchApiDataForNode: async (nodeId) => {
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const { cves, tier, lossMagnitude } = node.data;
        if (cves.length === 0) return;

        const metrics = await fetchThreatIntelligence(cves);
        const financialRisk = calculateFinancialRisk(cves, tier, metrics, lossMagnitude);

        get().updateNode(nodeId, {
          metrics,
          financialRisk,
          lastEnriched: new Date().toISOString(),
        });
      },

      fetchApiDataForAllNodes: async () => {
        const { nodes } = get();
        await Promise.all(nodes.map((node) => get().fetchApiDataForNode(node.id)));
      },
    }),
    {
      name: "cyber-sandbox-briefing-store-oakoc",
      skipHydration: true,
    }
  )
);
