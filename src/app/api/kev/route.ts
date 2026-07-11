import { NextResponse } from "next/server";
import { KEVItem } from "@/types";
import { getKevMap } from "@/lib/server/kevCatalog";

const CVE_ID_RE = /^CVE-\d{4}-\d+$/;
const MAX_CVES_PER_REQUEST = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cvesParam = searchParams.get("cves");

  if (!cvesParam) {
    return NextResponse.json({ error: "Missing 'cves' query parameter" }, { status: 400 });
  }

  const rawList = cvesParam
    .split(",")
    .map((cve) => cve.toUpperCase().trim())
    .filter((cve) => cve.length > 0);

  if (rawList.length > MAX_CVES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many CVEs — maximum ${MAX_CVES_PER_REQUEST} per request` },
      { status: 400 },
    );
  }

  const cveList = rawList.filter((cve) => CVE_ID_RE.test(cve));

  if (cveList.length === 0) {
    return NextResponse.json({ error: "No valid CVEs provided" }, { status: 400 });
  }

  const kevMap = await getKevMap();
  const results: Record<string, { isExploited: boolean; details?: KEVItem }> = {};

  for (const cve of cveList) {
    const item = kevMap.get(cve);
    results[cve] = item ? { isExploited: true, details: item } : { isExploited: false };
  }

  return NextResponse.json(results);
}
