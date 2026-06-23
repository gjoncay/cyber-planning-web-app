import "server-only";
import { KEVCatalog, KEVItem } from "@/types";

/* Shared in-memory cache of the CISA KEV catalog (~5MB). Both the /api/kev
   lookup and the /api/cve-search typeahead read from the same map so the
   catalog is only fetched once per server process per TTL. */
let cached: Map<string, KEVItem> | null = null;
let lastFetched = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export async function getKevMap(): Promise<Map<string, KEVItem>> {
  const now = Date.now();
  if (cached && now - lastFetched < CACHE_TTL) return cached;

  try {
    const res = await fetch(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) throw new Error(`CISA KEV fetch failed: ${res.statusText}`);

    const data: KEVCatalog = await res.json();
    const map = new Map<string, KEVItem>();
    if (Array.isArray(data?.vulnerabilities)) {
      for (const v of data.vulnerabilities) map.set(v.cveID.toUpperCase().trim(), v);
    }
    cached = map;
    lastFetched = now;
    return cached;
  } catch (err) {
    console.error("Error fetching CISA KEV data:", err);
    return cached ?? new Map<string, KEVItem>();
  }
}
