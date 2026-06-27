import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "src/data");
const URL = "https://attack.mitre.org/analytics/";

console.log(`[sync-analytics] fetching ${URL}`);

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
        const trRegex = /<tr>\s*<td>\s*<a[^>]*>\s*(AN\d{4})\s*<\/a>\s*<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>/g;
        
        const analytics = [];
        let match;
        while ((match = trRegex.exec(rawData)) !== null) {
          const id = match[1].trim();
          
          const platform = match[2].replace(/<[^>]*>/g, "").trim();
          const domain = match[3].replace(/<[^>]*>/g, "").trim();
          
          const detMatch = match[4].match(/DET\d{4}/);
          const relatedDetection = detMatch ? detMatch[0] : null;

          let desc = match[5]
            .replace(/<[^>]*>/g, " ") // remove inner HTML tags
            .replace(/\s+/g, " ")     // condense whitespace
            .trim();

          analytics.push({
            id,
            platform,
            domain,
            relatedDetection,
            description: desc,
          });
        }

        if (analytics.length === 0) {
          console.error("[sync-analytics] No analytics found! The HTML structure might have changed.");
          return;
        }

        fs.mkdirSync(OUT_DIR, { recursive: true });
        const outPath = path.resolve(OUT_DIR, "analytics.json");
        fs.writeFileSync(outPath, JSON.stringify(analytics, null, 2));

        console.log(`[sync-analytics] wrote analytics.json (${analytics.length} items)`);
      } catch (e) {
        console.error(e.message);
      }
    });
  })
  .on("error", (e) => {
    console.error(`Got error: ${e.message}`);
  });
