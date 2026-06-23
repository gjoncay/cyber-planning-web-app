import { Node, Edge } from "reactflow";

export type ThreatTier =
  | "observation"
  | "avenue-of-approach"
  | "obstacle"
  | "key-terrain"
  | "cover-concealment";

export interface VulnerabilityMetrics {
  cveId: string;
  isExploited: boolean;
  epssScore: number;
  epssPercentile: number;
  description?: string;
}

export interface CustomNodeData {
  id: string;
  name: string;
  ips: string[];
  cves: string[];
  tier: ThreatTier;
  description: string;
  sigmaRules: string[];
  lossMagnitude: number; // in USD
  metrics?: Record<string, VulnerabilityMetrics>; // map of cveId -> metrics
  financialRisk: number; // Computed risk score
  lastEnriched?: string; // ISO date string
  threatActor?: string; // IPOE Threat Actor association
}

export type CustomNode = Node<CustomNodeData>;
export type CustomEdge = Edge<{ isAttackPath?: boolean }>;

export interface KEVItem {
  cveID: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownAssociatedCampaignOrGroup: string;
  notes: string;
}

export interface KEVCatalog {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: KEVItem[];
}
