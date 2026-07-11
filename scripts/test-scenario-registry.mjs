/**
 * Smoke test for the named-scenario registry logic (src/lib/scenarios.ts):
 * compiles the real modules and exercises the save / load / switch round-trip
 * the store performs, plus validation, rename, duplicate and delete.
 * Run: node scripts/test-scenario-registry.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = mkdtempSync(path.join(tmpdir(), "scenario-test-"));

writeFileSync(
  path.join(out, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      module: "commonjs",
      target: "es2020",
      moduleResolution: "node",
      lib: ["es2020", "dom"],
      baseUrl: root,
      paths: { "@/*": ["src/*"] },
      rootDir: path.join(root, "src"),
      outDir: out,
      skipLibCheck: true,
      esModuleInterop: true,
      types: [],
    },
    files: [path.join(root, "src/lib/scenarios.ts")],
  }),
);
execFileSync(path.join(root, "node_modules/.bin/tsc"), ["-p", path.join(out, "tsconfig.json")], { stdio: "inherit" });

// Rewrite the "@/lib/..." aliases in the emitted CommonJS to relative paths.
for (const f of ["lib/scenarios.js", "lib/plan.js", "lib/oakoc.js"]) {
  const p = path.join(out, f);
  writeFileSync(p, readFileSync(p, "utf8").replaceAll('require("@/lib/', 'require("./'));
}

const require = createRequire(import.meta.url);
const S = require(path.join(out, "lib/scenarios.js"));

let failures = 0;
const check = (label, cond) => {
  if (!cond) failures++;
  console.log(`${cond ? "  ok " : "  FAIL"} ${label}`);
};

const el = (id, name, tier = "key-terrain") => ({ id, name, tier, cves: [], description: "" });
const chain = (id, elements) => ({ id, name: id, color: "#557085", elements });

console.log("Scenario registry smoke test");

// --- Save as: working plan snapshotted into a fresh registry ---
let registry = [];
const planA = { elements: [el("a1", "DC"), el("a2", "VPN", "avenue-of-approach")], chains: [chain("c1", ["a1"])] };
registry = S.upsertScenario(registry, { id: "id-A", name: "Plan A", ...planA, at: 1000 });
check("saveAs creates one entry", registry.length === 1 && registry[0].name === "Plan A");
check("entry stores {schema, elements, chains}",
  registry[0].data.schema >= 1 && registry[0].data.elements.length === 2 && registry[0].data.chains.length === 1);

// --- Switch: auto-save current (Plan A working copy, edited) then load Plan B ---
registry = S.upsertScenario(registry, { id: "id-B", name: "Plan B", elements: [el("b1", "Mail")], chains: [], at: 2000 });
// working plan (Plan A) gained an element since last save; switching stashes it first
const editedA = { elements: [...planA.elements, el("a3", "EDR", "observation")], chains: planA.chains };
registry = S.upsertScenario(registry, { id: "id-A", name: "Plan A", ...editedA, at: 3000 });
const loadedB = registry.find((s) => s.id === "id-B");
check("switch auto-saves outgoing plan (edit not lost)",
  registry.find((s) => s.id === "id-A").data.elements.length === 3);
check("switch loads target intact", loadedB.data.elements.length === 1 && loadedB.data.elements[0].name === "Mail");
check("registry still has both plans", registry.length === 2);

// --- Round-trip: load Plan A back and compare deep-equal ---
const reloadedA = registry.find((s) => s.id === "id-A");
check("save/load round-trip preserves elements+chains exactly",
  JSON.stringify({ elements: reloadedA.data.elements, chains: reloadedA.data.chains }) === JSON.stringify(editedA));

// --- Validation reuses the plan-file validator ---
check("validateScenario accepts a stored entry", (() => {
  try { S.validateScenario(JSON.parse(JSON.stringify(reloadedA))); return true; } catch { return false; }
})());
check("validateScenario rejects a bad tier", (() => {
  const bad = JSON.parse(JSON.stringify(reloadedA));
  bad.data.elements[0].tier = "not-a-tier";
  try { S.validateScenario(bad); return false; } catch { return true; }
})());
check("sanitizeRegistry drops corrupt entries, keeps good ones",
  S.sanitizeRegistry([reloadedA, { junk: true }, loadedB]).length === 2);
check("sanitizeRegistry tolerates non-arrays", S.sanitizeRegistry("garbage").length === 0);

// --- Rename / duplicate / delete ---
registry = S.renameScenario(registry, "id-B", "Plan B (final)");
check("rename updates name", registry.find((s) => s.id === "id-B").name === "Plan B (final)");
const dup = S.duplicateScenario(registry, "id-A", 4000);
check("duplicate appends a copy with new id",
  dup.list.length === 3 && dup.copy.id !== "id-A" && dup.copy.name === "Plan A (copy)" &&
  JSON.stringify(dup.copy.data.elements) === JSON.stringify(reloadedA.data.elements));
registry = S.removeScenario(dup.list, "id-B");
check("delete removes only the target", registry.length === 2 && !registry.some((s) => s.id === "id-B"));

// --- Misc helpers ---
check("blank names fall back to Untitled plan",
  S.upsertScenario([], { id: "x", name: "   ", elements: [], chains: [] })[0].name === S.UNTITLED_NAME);
check("relativeTime buckets", S.relativeTime(Date.now() - 10_000) === "just now" &&
  S.relativeTime(Date.now() - 5 * 60_000) === "5m ago" && S.relativeTime(Date.now() - 3 * 3_600_000) === "3h ago");

rmSync(out, { recursive: true, force: true });
if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll scenario registry checks passed.");
