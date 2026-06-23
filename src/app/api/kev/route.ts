import { NextResponse } from "next/server";
import { KEVItem } from "@/types";
import { getKevMap } from "@/lib/server/kevCatalog";

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

  const kevMap = await getKevMap();
  const results: Record<string, { isExploited: boolean; details?: KEVItem }> = {};

  for (const cve of cveList) {
    const item = kevMap.get(cve);
    results[cve] = item ? { isExploited: true, details: item } : { isExploited: false };
  }

  return NextResponse.json(results);
}
