import { NextResponse } from "next/server";
import { searchGroups } from "@/lib/server/attackData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  return NextResponse.json(searchGroups(q));
}
