import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";

  try {
    const filePath = path.join(process.cwd(), "src", "data", "detections.json");
    const data = await fs.readFile(filePath, "utf8");
    const detections = JSON.parse(data);

    if (!q) {
      return NextResponse.json(detections);
    }

    const filtered = detections.filter(
      (d: any) =>
        d.id.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q)
    );

    return NextResponse.json(filtered.slice(0, 50));
  } catch (error) {
    console.error("Error reading detections.json:", error);
    return NextResponse.json([]);
  }
}
