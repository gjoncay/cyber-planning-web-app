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
  vulnerabilityName?: string;
  description?: string;
}

/** A single OAKOC terrain element placed in the briefing model. */
export interface PlanElement {
  id: string;
  name: string;
  tier: ThreatTier;
  cves: string[];
  description: string;
  metrics?: Record<string, VulnerabilityMetrics>;
  lastEnriched?: string;
  // Adversary attribution is intentionally deferred — see FUTURE_REQUIREMENTS.md.
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
