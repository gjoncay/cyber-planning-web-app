import { NextResponse } from "next/server";
import { KEVCatalog, KEVItem } from "@/types";

// In-memory cache for CISA KEV catalog to prevent hammering CISA and loading 4.5MB repeatedly
let cachedKev: Map<string, KEVItem> | null = null;
let lastFetchedTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function fetchAndCacheKev() {
  const now = Date.now();
  if (cachedKev && now - lastFetchedTime < CACHE_TTL) {
    return cachedKev;
  }

  try {
    const res = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", {
      next: { revalidate: 86400 }, // Next.js level caching as well
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch CISA KEV catalog: ${res.statusText}`);
    }

    const data: KEVCatalog = await res.json();
    const map = new Map<string, KEVItem>();
    
    if (data && Array.isArray(data.vulnerabilities)) {
      for (const vuln of data.vulnerabilities) {
        map.set(vuln.cveID.toUpperCase().trim(), vuln);
      }
    }

    cachedKev = map;
    lastFetchedTime = now;
    return cachedKev;
  } catch (error) {
    console.error("Error fetching CISA KEV data:", error);
    // Return stale cache if available, else empty map
    return cachedKev || new Map<string, KEVItem>();
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cvesParam = searchParams.get("cves");

  if (!cvesParam) {
    return NextResponse.json({ error: "Missing 'cves' query parameter" }, { status: 400 });
  }

  const cveList = cvesParam
    .split(",")
    .map((cve) => cve.toUpperCase().trim())
    .filter((cve) => cve.length > 0);

  if (cveList.length === 0) {
    return NextResponse.json({ error: "No valid CVEs provided" }, { status: 400 });
  }

  const kevMap = await fetchAndCacheKev();
  const results: Record<string, { isExploited: boolean; details?: KEVItem }> = {};

  for (const cve of cveList) {
    const item = kevMap.get(cve);
    if (item) {
      results[cve] = {
        isExploited: true,
        details: item,
      };
    } else {
      results[cve] = {
        isExploited: false,
      };
    }
  }

  return NextResponse.json(results);
}
