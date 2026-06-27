import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "src/data/attack");
const EXCEL_PATH = resolve(ROOT, "enterprise-attack-v19.1.xlsx");

console.log(`[sync-excel] reading ${EXCEL_PATH}`);
const wb = xlsx.readFile(EXCEL_PATH);

const readSheet = (name) => {
  if (!wb.SheetNames.includes(name)) return [];
  return xlsx.utils.sheet_to_json(wb.Sheets[name]);
};

const rawTechs = readSheet("techniques");
const rawGroups = readSheet("groups");
const rawCampaigns = readSheet("campaigns");
const rawSoftware = readSheet("software");
const rawRels = readSheet("relationships");

// 1. Parse Techniques
const techByAttackId = new Map();
for (const row of rawTechs) {
  const id = row["ID"];
  if (!id) continue;
  const tactics = row["tactics"] ? row["tactics"].split(",").map(s => s.trim()) : [];
  const isSub = !!row["is sub-technique"];
  const parent = id.includes(".") ? id.split(".")[0] : undefined;
  
  techByAttackId.set(id, {
    id,
    name: row["name"],
    tactics,
    isSub,
    parent,
  });
}
// Resolve parents
for (const t of techByAttackId.values()) {
  if (t.parent) t.parentName = techByAttackId.get(t.parent)?.name;
}
const techniques = [...techByAttackId.values()].sort((a, b) => a.id.localeCompare(b.id));

// 2. Parse Software
const software = [];
const softById = new Map();
for (const row of rawSoftware) {
  const id = row["ID"];
  if (!id) continue;
  const s = {
    id,
    name: row["name"],
    description: row["description"] || "",
    platforms: row["platforms"] ? row["platforms"].split(",").map(x => x.trim()) : [],
    type: row["type"] || "software",
  };
  software.push(s);
  softById.set(id, s);
}
software.sort((a, b) => a.id.localeCompare(b.id));

// 3. Parse Adversaries (Groups + Campaigns)
const adversariesMap = new Map();
for (const row of rawGroups) {
  const id = row["ID"];
  if (!id) continue;
  const aliases = row["associated groups"] ? row["associated groups"].split(",").map(x => x.trim()) : [];
  adversariesMap.set(id, {
    id,
    name: row["name"],
    aliases: aliases.filter(a => a !== row["name"]),
    type: "group",
  });
}
for (const row of rawCampaigns) {
  const id = row["ID"];
  if (!id) continue;
  adversariesMap.set(id, {
    id,
    name: row["name"],
    aliases: [],
    type: "campaign",
  });
}

// 4. Parse Relationships
const advTechniques = {}; // adv_id -> Set of tech_id
const advSoftware = {};   // adv_id -> Set of software_id
const softTechniques = {}; // software_id -> Set of tech_id

for (const rel of rawRels) {
  const srcId = rel["source ID"];
  const tgtId = rel["target ID"];
  const relType = rel["mapping type"];

  if (relType === "uses") {
    // Adv -> Tech
    if (adversariesMap.has(srcId) && techByAttackId.has(tgtId)) {
      (advTechniques[srcId] ||= new Set()).add(tgtId);
    }
    // Adv -> Software
    if (adversariesMap.has(srcId) && softById.has(tgtId)) {
      (advSoftware[srcId] ||= new Set()).add(tgtId);
    }
    // Software -> Tech
    if (softById.has(srcId) && techByAttackId.has(tgtId)) {
      (softTechniques[srcId] ||= new Set()).add(tgtId);
    }
  }
}

// Map tactics to software based on the techniques they use
for (const s of software) {
  const techs = softTechniques[s.id];
  const tacticsSet = new Set();
  if (techs) {
    for (const tid of techs) {
      const t = techByAttackId.get(tid);
      if (t && t.tactics) {
        t.tactics.forEach(tac => tacticsSet.add(tac));
      }
    }
  }
  s.tactics = [...tacticsSet].sort();
}

// Finalize adversaries (only keep those with TTPs or Software)
const adversaries = [];
const advTechOut = {};
const advSoftOut = {};

for (const adv of adversariesMap.values()) {
  const techSet = advTechniques[adv.id];
  const softSet = advSoftware[adv.id];
  
  if ((!techSet || techSet.size === 0) && (!softSet || softSet.size === 0)) {
    continue; // Skip if no data
  }
  
  adv.techniqueCount = techSet ? techSet.size : 0;
  adv.softwareCount = softSet ? softSet.size : 0;
  adversaries.push(adv);
  
  if (techSet) advTechOut[adv.id] = [...techSet].sort();
  if (softSet) advSoftOut[adv.id] = [...softSet].sort();
}
adversaries.sort((a, b) => a.name.localeCompare(b.name));

mkdirSync(OUT_DIR, { recursive: true });
const write = (file, data) => {
  const p = resolve(OUT_DIR, file);
  writeFileSync(p, JSON.stringify(data));
  console.log(`[sync-excel] wrote ${file} (${(JSON.stringify(data).length / 1024).toFixed(0)} KB)`);
};

write("adversaries.json", adversaries);
write("techniques.json", techniques);
write("software.json", software);
write("adversary-techniques.json", advTechOut);
write("adversary-software.json", advSoftOut);

console.log(
  `[sync-excel] done — ${adversaries.length} adversaries, ${techniques.length} techniques, ${software.length} software`
);
