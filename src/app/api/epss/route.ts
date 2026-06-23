import { NextResponse } from "next/server";

interface EPSSResponseItem {
  cve: string;
  epss: string;
  percentile: string;
  date: string;
}

interface EPSSResponse {
  status: string;
  "status-code": number;
  version: string;
  access: string;
  total: number;
  offset: number;
  limit: number;
  data: EPSSResponseItem[];
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

  // FIRST EPSS API accepts multiple CVEs joined by comma
  const targetUrl = `https://api.first.org/data/v1/epss?cve=${cveList.join(",")}`;

  try {
    const res = await fetch(targetUrl, {
      next: { revalidate: 3600 }, // Cache on Next.js server side for 1 hour
    });

    if (!res.ok) {
      throw new Error(`FIRST EPSS API responded with status ${res.status}`);
    }

    const data: EPSSResponse = await res.json();
    
    // Transform into a simpler dictionary lookup for the client
    const results: Record<string, { epssScore: number; epssPercentile: number }> = {};
    
    if (data && data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        results[item.cve.toUpperCase()] = {
          epssScore: parseFloat(item.epss),
          epssPercentile: parseFloat(item.percentile),
        };
      }
    }

    // Default missing CVEs to 0 score/percentile to maintain consistency
    for (const cve of cveList) {
      if (!results[cve]) {
        results[cve] = { epssScore: 0.0, epssPercentile: 0.0 };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error proxying to EPSS API:", error);
    return NextResponse.json({ error: "Failed to fetch EPSS data" }, { status: 502 });
  }
}
