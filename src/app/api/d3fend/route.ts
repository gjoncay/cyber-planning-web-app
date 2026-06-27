import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const mitigatesParam = searchParams.get("mitigates") || "";

  try {
    const dataPath = path.join(process.cwd(), "src", "data", "d3fend_lite.json");
    const fileContents = await fs.readFile(dataPath, "utf8");
    const d3fendData = JSON.parse(fileContents);

    if (mitigatesParam) {
      const targets = mitigatesParam.split(",").map(s => s.trim().toUpperCase());
      const results = d3fendData.filter((tech: any) => 
        targets.some(t => tech.mitigates.includes(t))
      );
      // Don't slice if specifically asking for mitigations
      return NextResponse.json(results);
    }

    const lowerQ = q.toLowerCase();
    
    // Filter by name or ID
    const results = d3fendData.filter((tech: any) => 
      tech.name.toLowerCase().includes(lowerQ) ||
      tech.id.toLowerCase().includes(lowerQ) ||
      tech.description.toLowerCase().includes(lowerQ)
    );

    return NextResponse.json(results.slice(0, 50));
  } catch (error) {
    console.error("Error loading D3FEND data:", error);
    return NextResponse.json([]);
  }
}
