import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";

  try {
    const filePath = path.join(process.cwd(), "src", "data", "analytics.json");
    const data = await fs.readFile(filePath, "utf8");
    const items = JSON.parse(data);

    if (!q) {
      return NextResponse.json(items.slice(0, 50));
    }

    const filtered = items.filter(
      (m: any) =>
        m.id.toLowerCase().includes(q) ||
        (m.relatedDetection && m.relatedDetection.toLowerCase().includes(q))
    );

    return NextResponse.json(filtered.slice(0, 50));
  } catch (error) {
    console.error("Error reading analytics.json:", error);
    return NextResponse.json([]);
  }
}
