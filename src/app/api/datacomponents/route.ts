import { NextResponse } from "next/server";
import { searchDataComponents } from "@/lib/server/libraryData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";
  return NextResponse.json(searchDataComponents(q));
}
