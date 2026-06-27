export type ThreatTier =
  | "observation"
  | "avenue-of-approach"
  | "obstacle"
  | "key-terrain"
  | "cover-concealment";

export interface AttackChain {
  id: string; // e.g. "chain-1"
  name: string; // e.g. "Ransomware Path"
  color: string; // e.g. "#ff0000"
  elements: string[]; // array of PlanElement IDs
}

export interface VulnerabilityMetrics {
  cveId: string;
  isExploited: boolean;
  epssScore: number;
  epssPercentile: number;
  vulnerabilityName?: string;
  description?: string;
}

/** A MITRE ATT&CK technique reference — the language of how a threat operates. */
export interface TechniqueRef {
  id: string; // e.g. "T1021.002"
  name?: string; // e.g. "SMB / Windows Admin Shares"
}

/** A single OAKOC terrain element placed in the briefing model. */
export interface PlanElement {
  id: string;
  name: string;
  tier: ThreatTier;
  cves: string[];
  techniques?: TechniqueRef[];
  detections?: { id: string; name?: string }[];
  mitigations?: { id: string; name?: string }[];
  datacomponents?: { id: string; name?: string }[];
  analytics?: { id: string; name?: string }[];
  software?: { id: string; name?: string }[];
  description: string;
  metrics?: Record<string, VulnerabilityMetrics>;
  lastEnriched?: string;
  // Adversary attribution (pull TTPs from an ATT&CK group) — see FUTURE_REQUIREMENTS.md.
}

/** Typeahead suggestion sourced from the CISA KEV catalog. */
export interface CveSuggestion {
  cveID: string;
  vulnerabilityName: string;
  vendorProject?: string;
}

export interface KEVItem {
  cveID: string;
  vulnerabilityName: string;
  vendorProject?: string;
  product?: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownAssociatedCampaignOrGroup?: string;
  notes?: string;
}

export interface KEVCatalog {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: KEVItem[];
}
