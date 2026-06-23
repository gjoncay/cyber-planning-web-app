import { NextResponse } from "next/server";
import { getGroup } from "@/lib/server/attackData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = getGroup(id);
  if (!result) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  return NextResponse.json(result);
}
