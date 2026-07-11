import { NextResponse } from "next/server";
import { searchD3fend, d3fendForAttackIds } from "@/lib/server/libraryData";

/** Cap on ATT&CK ids accepted by the `mitigates` reverse lookup. */
const MAX_MITIGATES_IDS = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";
  const mitigatesParam = searchParams.get("mitigates") || "";

  if (mitigatesParam) {
    const targets = mitigatesParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_MITIGATES_IDS);
    return NextResponse.json(d3fendForAttackIds(targets));
  }

  return NextResponse.json(searchD3fend(q));
}
