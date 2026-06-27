import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "src/data");
const URL = "https://attack.mitre.org/mitigations/enterprise/";

console.log(`[sync-mitigations] fetching ${URL}`);

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
        const trRegex = /<tr>\s*<td>\s*<a[^>]*>\s*(M\d{4})\s*<\/a>\s*<\/td>\s*<td>\s*<a[^>]*>\s*([^<]+?)\s*<\/a>\s*<\/td>\s*<td>([\s\S]*?)<\/td>/g;
        
        const mitigations = [];
        let match;
        while ((match = trRegex.exec(rawData)) !== null) {
          let desc = match[3]
            .replace(/<[^>]*>/g, " ") // remove inner HTML tags
            .replace(/\s+/g, " ")     // condense whitespace
            .trim();

          mitigations.push({
            id: match[1].trim(),
            name: match[2].trim(),
            description: desc,
          });
        }

        if (mitigations.length === 0) {
          console.error("[sync-mitigations] No mitigations found! The HTML structure might have changed.");
          return;
        }

        fs.mkdirSync(OUT_DIR, { recursive: true });
        const outPath = path.resolve(OUT_DIR, "mitigations.json");
        fs.writeFileSync(outPath, JSON.stringify(mitigations, null, 2));

        console.log(`[sync-mitigations] wrote mitigations.json (${mitigations.length} mitigations)`);
      } catch (e) {
        console.error(e.message);
      }
    });
  })
  .on("error", (e) => {
    console.error(`Got error: ${e.message}`);
  });
