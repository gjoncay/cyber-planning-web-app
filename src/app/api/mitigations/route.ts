import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";

  try {
    const filePath = path.join(process.cwd(), "src", "data", "mitigations.json");
    const data = await fs.readFile(filePath, "utf8");
    const mitigations = JSON.parse(data);

    if (!q) {
      return NextResponse.json(mitigations);
    }

    const filtered = mitigations.filter(
      (m: any) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
    );

    return NextResponse.json(filtered.slice(0, 50));
  } catch (error) {
    console.error("Error reading mitigations.json:", error);
    return NextResponse.json([]);
  }
}
