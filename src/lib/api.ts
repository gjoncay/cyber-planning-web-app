import { ThreatTier, VulnerabilityMetrics } from "@/types";

/**
 * Standard asset values (Loss Magnitude) based on the OAKOC tier framework,
 * used for the FAIR-lite financial risk formula.
 */
export const TIER_ASSET_VALUES: Record<ThreatTier, number> = {
  observation: 10000,          // $10k
  "avenue-of-approach": 50000, // $50k
  obstacle: 100000,            // $100k
  "key-terrain": 1000000,      // $1M (Crown Jewels)
  "cover-concealment": 250000   // $250k
};

/**
 * Friendly display labels for OAKOC tiers
 */
export const TIER_LABELS: Record<ThreatTier, string> = {
  observation: "Observation (Telemetry)",
  "avenue-of-approach": "Avenues of Approach (Entry Points)",
  obstacle: "Obstacles (Defenses)",
  "key-terrain": "Key Terrain (Crown Jewels)",
  "cover-concealment": "Cover & Concealment (Actor Evasion)"
};

/**
 * Fetch enrichment data for a list of CVE IDs by querying our server-side API proxy routes.
 */
export async function fetchThreatIntelligence(cves: string[]): Promise<Record<string, VulnerabilityMetrics>> {
  if (cves.length === 0) return {};

  const cleanCves = cves.map((cve) => cve.toUpperCase().trim()).filter(Boolean);
  if (cleanCves.length === 0) return {};

  const cvesQueryParam = cleanCves.join(",");

  try {
    const [kevRes, epssRes] = await Promise.all([
      fetch(`/api/kev?cves=${cvesQueryParam}`),
      fetch(`/api/epss?cves=${cvesQueryParam}`),
    ]);

    if (!kevRes.ok || !epssRes.ok) {
      throw new Error("Failed to fetch threat intelligence from proxy API endpoints.");
    }

    const kevData = await kevRes.json();
    const epssData = await epssRes.json();

    const mergedMetrics: Record<string, VulnerabilityMetrics> = {};

    for (const cve of cleanCves) {
      const isExploited = kevData[cve]?.isExploited || false;
      const cisaDetails = kevData[cve]?.details;
      const epssScore = epssData[cve]?.epssScore || 0;
      const epssPercentile = epssData[cve]?.epssPercentile || 0;

      mergedMetrics[cve] = {
        cveId: cve,
        isExploited,
        epssScore,
        epssPercentile,
        description: cisaDetails?.shortDescription || undefined,
      };
    }

    return mergedMetrics;
  } catch (error) {
    console.error("Error fetching threat intelligence:", error);
    const fallbacks: Record<string, VulnerabilityMetrics> = {};
    for (const cve of cleanCves) {
      fallbacks[cve] = {
        cveId: cve,
        isExploited: false,
        epssScore: 0,
        epssPercentile: 0,
      };
    }
    return fallbacks;
  }
}

/**
 * Calculates a "FAIR-lite" Financial Risk score for a node.
 * Formula: Risk = Likelihood (Average EPSS) * Impact (Loss Magnitude / Asset Value).
 * If no CVEs exist, a baseline likelihood of 0.001 (0.1% baseline risk) is used.
 */
export function calculateFinancialRisk(
  cves: string[],
  tier: ThreatTier,
  metrics?: Record<string, VulnerabilityMetrics>,
  customLossMagnitude?: number
): number {
  const lossMagnitude = customLossMagnitude ?? TIER_ASSET_VALUES[tier];
  
  if (cves.length === 0 || !metrics) {
    return Math.round(0.001 * lossMagnitude);
  }

  const validScores: number[] = [];
  for (const cve of cves) {
    const cveMetrics = metrics[cve.toUpperCase().trim()];
    if (cveMetrics) {
      let likelihood = cveMetrics.epssScore;
      if (cveMetrics.isExploited) {
        likelihood = Math.max(likelihood, 0.85); // Floor it at 85% probability if it is CISA KEV
      }
      validScores.push(likelihood);
    }
  }

  const averageLikelihood = validScores.length > 0 
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length 
    : 0.001;

  return Math.round(averageLikelihood * lossMagnitude);
}
