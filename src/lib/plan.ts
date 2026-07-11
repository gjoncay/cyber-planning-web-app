import { AttackChain, PlanElement, ThreatTier } from "@/types";
import { TIER_ORDER } from "@/lib/oakoc";

/** Current plan-file schema version. Bump alongside the store's persist version. */
export const PLAN_SCHEMA = 4;

export interface PlanFile {
  schema: number;
  exported: string; // ISO timestamp
  elements: PlanElement[];
  chains: AttackChain[];
}

/** Serialize the current plan to a versioned JSON document. */
export function exportPlan(elements: PlanElement[], chains: AttackChain[]): string {
  const doc: PlanFile = {
    schema: PLAN_SCHEMA,
    exported: new Date().toISOString(),
    elements,
    chains,
  };
  return JSON.stringify(doc, null, 2);
}

/** Trigger a browser download of a JSON text document. */
export function downloadJson(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Trigger a browser download of the serialized plan. */
export function downloadPlan(elements: PlanElement[], chains: AttackChain[]): void {
  downloadJson(`oakoc-plan-${new Date().toISOString().slice(0, 10)}.json`, exportPlan(elements, chains));
}

const TIERS = new Set<string>(TIER_ORDER);

function isRefList(v: unknown): boolean {
  return (
    v === undefined ||
    (Array.isArray(v) && v.every((r) => r && typeof r === "object" && typeof (r as { id?: unknown }).id === "string"))
  );
}

function validateElement(raw: unknown, i: number): PlanElement {
  if (!raw || typeof raw !== "object") throw new Error(`Element ${i} is not an object.`);
  const el = raw as Record<string, unknown>;
  if (typeof el.id !== "string" || !el.id) throw new Error(`Element ${i} is missing an id.`);
  if (typeof el.name !== "string" || !el.name) throw new Error(`Element "${el.id}" is missing a name.`);
  if (typeof el.tier !== "string" || !TIERS.has(el.tier)) {
    throw new Error(`Element "${el.id}" has an invalid tier "${String(el.tier)}".`);
  }
  if (!Array.isArray(el.cves) || !el.cves.every((c) => typeof c === "string")) {
    throw new Error(`Element "${el.id}" has an invalid cves list.`);
  }
  for (const key of ["techniques", "detections", "mitigations", "datacomponents", "analytics", "software", "d3fend"]) {
    if (!isRefList(el[key])) throw new Error(`Element "${el.id}" has an invalid ${key} list.`);
  }
  return {
    ...(el as unknown as PlanElement),
    tier: el.tier as ThreatTier,
    description: typeof el.description === "string" ? el.description : "",
  };
}

function validateChain(raw: unknown, i: number): AttackChain {
  if (!raw || typeof raw !== "object") throw new Error(`Chain ${i} is not an object.`);
  const c = raw as Record<string, unknown>;
  if (typeof c.id !== "string" || !c.id) throw new Error(`Chain ${i} is missing an id.`);
  if (typeof c.name !== "string") throw new Error(`Chain "${c.id}" is missing a name.`);
  if (!Array.isArray(c.elements) || !c.elements.every((e) => typeof e === "string")) {
    throw new Error(`Chain "${c.id}" has an invalid elements list.`);
  }
  return {
    id: c.id,
    name: c.name,
    color: typeof c.color === "string" ? c.color : "#557085",
    elements: c.elements as string[],
  };
}

/**
 * Validate an already-parsed plan-shaped document ({schema, elements, chains}).
 * Shared by file import and the scenario registry (which stores the same
 * shape). Throws with a readable message on anything malformed; never
 * partially applies.
 */
export function parsePlanDocument(parsed: unknown): { elements: PlanElement[]; chains: AttackChain[] } {
  if (!parsed || typeof parsed !== "object") throw new Error("File is not a plan document.");
  const doc = parsed as Record<string, unknown>;
  if (typeof doc.schema !== "number" || doc.schema < 1 || doc.schema > PLAN_SCHEMA) {
    throw new Error(`Unsupported plan schema ${String(doc.schema)} (this app reads schema 1–${PLAN_SCHEMA}).`);
  }
  if (!Array.isArray(doc.elements)) throw new Error("Plan file has no elements array.");
  if (doc.chains !== undefined && !Array.isArray(doc.chains)) throw new Error("Plan chains must be an array.");

  const elements = (doc.elements as unknown[]).map(validateElement);
  const chains = ((doc.chains as unknown[]) ?? []).map(validateChain);
  return { elements, chains };
}

/**
 * Parse and validate a plan JSON document. Throws with a readable message on
 * anything malformed; never partially applies.
 */
export function importPlan(json: string): { elements: PlanElement[]; chains: AttackChain[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  return parsePlanDocument(parsed);
}
