// Derives small, queryable ATT&CK JSON for this app from the sibling MITRE
// Diamond Dashboard's processed STIX bundle. This keeps the two apps on the
// SAME source data without bundling the full 24MB STIX here and without
// modifying the dashboard. Run: `npm run sync:attack`.
//
// Reads:  ../mitre-diamond-dashboard/public/data/attack.json  (override via $ATTACK_BUNDLE)
// Writes: src/data/attack/{groups,techniques,group-techniques}.json

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BUNDLE =
  process.env.ATTACK_BUNDLE ||
  resolve(ROOT, "../mitre-diamond-dashboard/public/data/attack.json");
const OUT_DIR = resolve(ROOT, "src/data/attack");

const mitreId = (obj) =>
  obj.external_references?.find((r) => r.source_name === "mitre-attack")?.external_id ?? null;
const active = (o) => !o.revoked && !o.x_mitre_deprecated;

console.log(`[sync-attack] reading ${BUNDLE}`);
const bundle = JSON.parse(readFileSync(BUNDLE, "utf8"));
const objects = bundle.objects ?? [];

// 1. Techniques (attack-pattern) keyed by STIX id and by ATT&CK id.
const techByStix = new Map();
const techByAttackId = new Map();
for (const o of objects) {
  if (o.type !== "attack-pattern" || !active(o)) continue;
  const id = mitreId(o);
  if (!id) continue;
  const tactics = (o.kill_chain_phases ?? [])
    .filter((p) => p.kill_chain_name === "mitre-attack")
    .map((p) => p.phase_name);
  const tech = {
    id,
    name: o.name,
    tactics,
    isSub: !!o.x_mitre_is_subtechnique,
    parent: id.includes(".") ? id.split(".")[0] : undefined,
  };
  techByStix.set(o.id, tech);
  techByAttackId.set(id, tech);
}
// Resolve parent technique names for sub-techniques.
for (const t of techByAttackId.values()) {
  if (t.parent) t.parentName = techByAttackId.get(t.parent)?.name;
}

// 2. Groups (intrusion-set).
const groupByStix = new Map();
for (const o of objects) {
  if (o.type !== "intrusion-set" || !active(o)) continue;
  const id = mitreId(o);
  if (!id) continue;
  groupByStix.set(o.id, {
    id,
    name: o.name,
    aliases: (o.aliases ?? []).filter((a) => a !== o.name),
  });
}

// 3. Group -> technique uses (relationship "uses": intrusion-set -> attack-pattern).
const groupTechniques = {}; // groupAttackId -> Set of techniqueAttackId
for (const o of objects) {
  if (o.type !== "relationship" || o.relationship_type !== "uses") continue;
  const g = groupByStix.get(o.source_ref);
  const t = techByStix.get(o.target_ref);
  if (!g || !t) continue;
  (groupTechniques[g.id] ||= new Set()).add(t.id);
}

// Finalize: only keep groups that actually use techniques; sort everything.
const groups = [];
const groupTechOut = {};
for (const g of groupByStix.values()) {
  const set = groupTechniques[g.id];
  if (!set || set.size === 0) continue;
  groups.push({ ...g, techniqueCount: set.size });
  groupTechOut[g.id] = [...set].sort();
}
groups.sort((a, b) => a.name.localeCompare(b.name));

const techniques = [...techByAttackId.values()].sort((a, b) => a.id.localeCompare(b.id));

mkdirSync(OUT_DIR, { recursive: true });
const write = (file, data) => {
  const path = resolve(OUT_DIR, file);
  writeFileSync(path, JSON.stringify(data));
  console.log(`[sync-attack] wrote ${file} (${(JSON.stringify(data).length / 1024).toFixed(0)} KB)`);
};
write("groups.json", groups);
write("techniques.json", techniques);
write("group-techniques.json", groupTechOut);

console.log(
  `[sync-attack] done — ${groups.length} groups, ${techniques.length} techniques, ${Object.keys(groupTechOut).length} group maps`,
);
