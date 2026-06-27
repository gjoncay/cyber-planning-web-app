import { VulnerabilityMetrics, CveSuggestion } from "@/types";
import { AttackAdversary, AttackTechnique, AttackSoftware } from "@/lib/attack";

export interface DetectionStrategy {
  id: string;
  name: string;
  domain: string;
}

export interface Mitigation {
  id: string;
  name: string;
  description: string;
}

export interface DataComponent {
  id: string;
  name: string;
  domain: string;
  description: string;
}

export interface Analytic {
  id: string;
  platform: string;
  domain: string;
  relatedDetection: string | null;
  description: string;
}

export interface D3fendTechnique {
  id: string;
  name: string;
  description: string;
  category: string;
  mitigates: string[];
}

/**
 * Enrich a list of CVE IDs with CISA KEV exploitation status and FIRST EPSS
 * likelihood scores via the server-side proxy routes.
 */
export async function fetchThreatIntelligence(
  cves: string[],
): Promise<Record<string, VulnerabilityMetrics>> {
  const cleanCves = cves.map((cve) => cve.toUpperCase().trim()).filter(Boolean);
  if (cleanCves.length === 0) return {};

  const query = cleanCves.join(",");

  try {
    const [kevRes, epssRes] = await Promise.all([
      fetch(`/api/kev?cves=${query}`),
      fetch(`/api/epss?cves=${query}`),
    ]);
    if (!kevRes.ok || !epssRes.ok) throw new Error("Threat intel proxy request failed.");

    const kevData = await kevRes.json();
    const epssData = await epssRes.json();

    const merged: Record<string, VulnerabilityMetrics> = {};
    for (const cve of cleanCves) {
      merged[cve] = {
        cveId: cve,
        isExploited: kevData[cve]?.isExploited || false,
        epssScore: epssData[cve]?.epssScore || 0,
        epssPercentile: epssData[cve]?.epssPercentile || 0,
        vulnerabilityName: kevData[cve]?.details?.vulnerabilityName,
        description: kevData[cve]?.details?.shortDescription,
      };
    }
    return merged;
  } catch (error) {
    console.error("Error fetching threat intelligence:", error);
    const fallback: Record<string, VulnerabilityMetrics> = {};
    for (const cve of cleanCves) {
      fallback[cve] = { cveId: cve, isExploited: false, epssScore: 0, epssPercentile: 0 };
    }
    return fallback;
  }
}

/** Fluid CVE typeahead — suggestions from the CISA KEV catalog. */
export async function searchCves(query: string): Promise<CveSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(`/api/cve-search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as CveSuggestion[];
  } catch {
    return [];
  }
}

/** Fluid ATT&CK technique typeahead. */
export async function searchTechniques(query: string): Promise<AttackTechnique[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(`/api/attack/techniques?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as AttackTechnique[];
  } catch {
    return [];
  }
}

/** ATT&CK adversary typeahead (for adversary import). */
export async function searchGroups(query: string): Promise<AttackAdversary[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  try {
    const res = await fetch(`/api/attack/groups?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as AttackAdversary[];
  } catch {
    return [];
  }
}

/** Fetch an adversary's techniques and software for the adversary → OAKOC import. */
export async function fetchGroupTechniques(
  id: string,
): Promise<{ group: AttackAdversary; techniques: AttackTechnique[]; software: AttackSoftware[] } | null> {
  try {
    const res = await fetch(`/api/attack/group/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fluid Software typeahead. */
export async function searchSoftware(query: string): Promise<AttackSoftware[]> {
  const q = query.trim();
  try {
    const res = await fetch(`/api/attack/software?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as AttackSoftware[];
  } catch {
    return [];
  }
}

/** Fluid Detection Strategies typeahead. */
export async function searchDetections(query: string): Promise<DetectionStrategy[]> {
  const q = query.trim();
  try {
    // If no query, we return all (or top 50, handled by API)
    const res = await fetch(`/api/detections?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as DetectionStrategy[];
  } catch {
    return [];
  }
}

/** Fluid Mitigations typeahead. */
export async function searchMitigations(query: string): Promise<Mitigation[]> {
  const q = query.trim();
  try {
    const res = await fetch(`/api/mitigations?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as Mitigation[];
  } catch {
    return [];
  }
}

/** Fluid Data Components typeahead. */
export async function searchDataComponents(query: string): Promise<DataComponent[]> {
  const q = query.trim();
  try {
    const res = await fetch(`/api/datacomponents?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as DataComponent[];
  } catch {
    return [];
  }
}

/** Fluid Analytics typeahead. */
export async function searchAnalytics(query: string): Promise<Analytic[]> {
  const q = query.trim();
  try {
    const res = await fetch(`/api/analytics?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as Analytic[];
  } catch {
    return [];
  }
}

/** Fluid D3FEND typeahead. */
export async function searchD3fend(query: string): Promise<D3fendTechnique[]> {
  const q = query.trim();
  try {
    const res = await fetch(`/api/d3fend?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as D3fendTechnique[];
  } catch {
    return [];
  }
}

/** Fetch recommended D3FEND defenses based on ATT&CK technique IDs. */
export async function getRecommendedDefenses(techniqueIds: string[]): Promise<D3fendTechnique[]> {
  if (techniqueIds.length === 0) return [];
  try {
    const query = techniqueIds.join(",");
    const res = await fetch(`/api/d3fend?mitigates=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return (await res.json()) as D3fendTechnique[];
  } catch {
    return [];
  }
}
