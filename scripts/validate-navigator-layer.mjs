/**
 * Validate the ATT&CK Navigator layer export (src/lib/navigatorLayer.ts):
 * compiles the real module, builds a layer from a fabricated plan, then
 * JSON round-trips and shape-checks it. Run: node scripts/validate-navigator-layer.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = mkdtempSync(path.join(tmpdir(), "nav-layer-"));

// Compile just the module under test (its only imports are type-only).
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
    files: [path.join(root, "src/lib/navigatorLayer.ts")],
  }),
);
execFileSync(path.join(root, "node_modules/.bin/tsc"), ["-p", path.join(out, "tsconfig.json")], { stdio: "inherit" });

const require = createRequire(import.meta.url);
const { buildNavigatorLayer, countTechniques, layerFilename } = require(path.join(out, "lib/navigatorLayer.js"));

let failures = 0;
const check = (label, cond) => {
  if (!cond) failures++;
  console.log(`${cond ? "  ok " : "  FAIL"} ${label}`);
};

// Fabricated plan: T1059 referenced by two elements, T1566.001 by one.
const plan = [
  { id: "a", name: "Edge VPN", tier: "avenue-of-approach", cves: [], description: "", techniques: [{ id: "T1059", name: "Command and Scripting Interpreter" }, { id: "T1566.001" }] },
  { id: "b", name: "Workstation Fleet", tier: "key-terrain", cves: [], description: "", techniques: [{ id: "T1059" }] },
  { id: "c", name: "No techniques here", tier: "obstacle", cves: [], description: "" },
];

const layer = buildNavigatorLayer("Q3 Tabletop: Ransomware", plan);
const roundTripped = JSON.parse(JSON.stringify(layer));

console.log("Navigator layer validation");
check("layer serializes and parses as JSON", roundTripped && typeof roundTripped === "object");
check('name is "<scenario> — techniques"', roundTripped.name === "Q3 Tabletop: Ransomware — techniques");
check("versions {attack:19, navigator:5.1.0, layer:4.5}",
  roundTripped.versions.attack === "19" && roundTripped.versions.navigator === "5.1.0" && roundTripped.versions.layer === "4.5");
check('domain is "enterprise-attack"', roundTripped.domain === "enterprise-attack");
check("description credits Chinook Cyber Planner", /Chinook Cyber Planner/.test(roundTripped.description));
check("two technique entries", Array.isArray(roundTripped.techniques) && roundTripped.techniques.length === 2);
const t1059 = roundTripped.techniques.find((t) => t.techniqueID === "T1059");
const t1566 = roundTripped.techniques.find((t) => t.techniqueID === "T1566.001");
check("T1059 score = 2 (two referencing elements)", t1059?.score === 2);
check("T1059 comment joins element names", t1059?.comment === "Edge VPN, Workstation Fleet");
check("T1566.001 score = 1", t1566?.score === 1 && t1566.comment === "Edge VPN");
check("every entry has {techniqueID:string, score:number, comment:string}",
  roundTripped.techniques.every((t) => typeof t.techniqueID === "string" && typeof t.score === "number" && typeof t.comment === "string"));
check("gradient: 2 colors, minValue 0, maxValue = max score",
  roundTripped.gradient.colors.length === 2 && roundTripped.gradient.colors[1] === "#58855f" &&
  roundTripped.gradient.minValue === 0 && roundTripped.gradient.maxValue === 2);
check("countTechniques counts distinct IDs", countTechniques(plan) === 2);
check("layerFilename slugs the scenario name", layerFilename("Q3 Tabletop: Ransomware") === "q3-tabletop-ransomware-layer.json");
check("empty plan returns null (button disabled state)", buildNavigatorLayer("x", [{ id: "c", name: "n", tier: "obstacle", cves: [], description: "" }]) === null);

rmSync(out, { recursive: true, force: true });
if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll Navigator layer checks passed. Sample layer:\n");
console.log(JSON.stringify(layer, null, 2));
