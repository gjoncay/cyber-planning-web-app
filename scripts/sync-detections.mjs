import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "src/data");
const URL = "https://attack.mitre.org/detectionstrategies/";

console.log(`[sync-detections] fetching ${URL}`);

https
  .get(URL, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to fetch. Status Code: ${res.statusCode}`);
      res.resume();
      return;
    }

    let rawData = "";
    res.on("data", (chunk) => {
      rawData += chunk;
    });

    res.on("end", () => {
      try {
        const trRegex = /<tr>\s*<td>\s*<a[^>]*>\s*(DET\d{4})\s*<\/a>\s*<\/td>\s*<td>\s*<a[^>]*>\s*([^<]+?)\s*<\/a>\s*<\/td>\s*<td>\s*([^<]+?)\s*(?:<br>)?\s*<\/td>/gs;
        
        const detections = [];
        let match;
        while ((match = trRegex.exec(rawData)) !== null) {
          detections.push({
            id: match[1].trim(),
            name: match[2].trim(),
            domain: match[3].trim(),
          });
        }

        if (detections.length === 0) {
          console.error("[sync-detections] No detections found! The HTML structure might have changed.");
          return;
        }

        fs.mkdirSync(OUT_DIR, { recursive: true });
        const outPath = path.resolve(OUT_DIR, "detections.json");
        fs.writeFileSync(outPath, JSON.stringify(detections, null, 2));

        console.log(`[sync-detections] wrote detections.json (${detections.length} strategies)`);
      } catch (e) {
        console.error(e.message);
      }
    });
  })
  .on("error", (e) => {
    console.error(`Got error: ${e.message}`);
  });
