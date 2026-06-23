import { NextResponse } from "next/server";
import { searchTechniques } from "@/lib/server/attackData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  return NextResponse.json(searchTechniques(q));
}
