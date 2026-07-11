import type { AttackChain, PlanElement } from "@/types";
import { PLAN_SCHEMA, parsePlanDocument } from "@/lib/plan";

/**
 * Named-scenario registry: pure data logic, no store/React dependencies so it
 * can be unit-tested in plain Node. The registry persists separately from the
 * working plan (see useScenarioStore) — each entry stores the same
 * {schema, elements, chains} shape the plan file uses.
 */

export const UNTITLED_NAME = "Untitled plan";

export interface ScenarioData {
  schema: number;
  elements: PlanElement[];
  chains: AttackChain[];
}

export interface Scenario {
  id: string;
  name: string;
  /** Last-saved timestamp (ms epoch). */
  updated: number;
  data: ScenarioData;
}

export function makeScenarioId(): string {
  return `scn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Wrap the working plan in the persisted scenario-data shape. */
export function snapshotData(elements: PlanElement[], chains: AttackChain[]): ScenarioData {
  return { schema: PLAN_SCHEMA, elements, chains };
}

/**
 * Save (create or update) a scenario in the registry. Returns a new list —
 * never mutates. Existing entries keep their position; new ones append.
 */
export function upsertScenario(
  list: Scenario[],
  entry: { id: string; name: string; elements: PlanElement[]; chains: AttackChain[]; at?: number },
): Scenario[] {
  const scenario: Scenario = {
    id: entry.id,
    name: entry.name.trim() || UNTITLED_NAME,
    updated: entry.at ?? Date.now(),
    data: snapshotData(entry.elements, entry.chains),
  };
  const idx = list.findIndex((s) => s.id === entry.id);
  if (idx === -1) return [...list, scenario];
  const next = [...list];
  next[idx] = scenario;
  return next;
}

export function renameScenario(list: Scenario[], id: string, name: string): Scenario[] {
  const trimmed = name.trim();
  if (!trimmed) return list;
  return list.map((s) => (s.id === id ? { ...s, name: trimmed, updated: Date.now() } : s));
}

export function duplicateScenario(
  list: Scenario[],
  id: string,
  at: number = Date.now(),
): { list: Scenario[]; copy: Scenario | null } {
  const source = list.find((s) => s.id === id);
  if (!source) return { list, copy: null };
  const copy: Scenario = {
    id: makeScenarioId(),
    name: `${source.name} (copy)`,
    updated: at,
    data: { schema: source.data.schema, elements: source.data.elements, chains: source.data.chains },
  };
  return { list: [...list, copy], copy };
}

export function removeScenario(list: Scenario[], id: string): Scenario[] {
  return list.filter((s) => s.id !== id);
}

/**
 * Validate one persisted registry entry, reusing the plan-file validator for
 * the stored data shape. Throws on anything malformed.
 */
export function validateScenario(raw: unknown): Scenario {
  if (!raw || typeof raw !== "object") throw new Error("Scenario entry is not an object.");
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== "string" || !s.id) throw new Error("Scenario entry is missing an id.");
  if (typeof s.name !== "string" || !s.name) throw new Error(`Scenario "${s.id}" is missing a name.`);
  if (typeof s.updated !== "number") throw new Error(`Scenario "${s.name}" has an invalid timestamp.`);
  const { elements, chains } = parsePlanDocument(s.data);
  const schema = (s.data as Record<string, unknown>).schema as number;
  return { id: s.id, name: s.name, updated: s.updated, data: { schema, elements, chains } };
}

/** Validate a persisted registry list, dropping entries that fail validation. */
export function sanitizeRegistry(raw: unknown): Scenario[] {
  if (!Array.isArray(raw)) return [];
  const out: Scenario[] = [];
  for (const entry of raw) {
    try {
      out.push(validateScenario(entry));
    } catch {
      // Skip corrupt entries rather than losing the whole registry.
    }
  }
  return out;
}

/** Compact relative time for the scenario list — "just now", "5m ago", … */
export function relativeTime(updated: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - updated) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(updated).toLocaleDateString();
}
