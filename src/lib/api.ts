import { VulnerabilityMetrics, CveSuggestion } from "@/types";
import { AttackGroup, AttackTechnique } from "@/lib/attack";

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

/** ATT&CK group typeahead (for adversary import). */
export async function searchGroups(query: string): Promise<AttackGroup[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  try {
    const res = await fetch(`/api/attack/groups?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as AttackGroup[];
  } catch {
    return [];
  }
}

/** Fetch a group's techniques for the adversary → OAKOC import. */
export async function fetchGroupTechniques(
  id: string,
): Promise<{ group: AttackGroup; techniques: AttackTechnique[] } | null> {
  try {
    const res = await fetch(`/api/attack/group/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
