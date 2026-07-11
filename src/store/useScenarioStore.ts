import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useBriefingStore } from "@/store/useBriefingStore";
import {
  Scenario,
  UNTITLED_NAME,
  duplicateScenario,
  makeScenarioId,
  removeScenario,
  renameScenario,
  sanitizeRegistry,
  upsertScenario,
} from "@/lib/scenarios";

/**
 * Named-scenario registry, persisted under its own localStorage key so the
 * existing working-plan store ("cyber-sandbox-oakoc-v3") is untouched. The
 * working plan always lives in useBriefingStore; this store only tracks which
 * saved scenario it corresponds to (activeId) plus the saved snapshots.
 *
 * Invariant: no operation may lose working-plan data. Every switch away from
 * the current plan snapshots it into the registry first (auto-save).
 */

interface ScenarioState {
  scenarios: Scenario[];
  /** Registry id of the scenario the working plan belongs to (null = unsaved). */
  activeId: string | null;
  /** Display name of the working plan (kept even while unsaved). */
  activeName: string;

  /** Save the working plan under its current name, then start an empty plan. */
  newPlan: () => void;
  /** Save the working plan as a new registry entry with the given name. */
  saveAs: (name: string) => void;
  /** Snapshot the working plan into the registry, then load the target. */
  loadScenario: (id: string) => void;
  rename: (id: string, name: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
}

/** Snapshot the current working plan into the registry (auto-save). */
function stashCurrent(s: Pick<ScenarioState, "scenarios" | "activeId" | "activeName">): {
  scenarios: Scenario[];
  stashedId: string | null;
} {
  const { elements, chains } = useBriefingStore.getState();
  // Nothing worth saving: an unsaved, completely empty plan.
  if (s.activeId === null && elements.length === 0 && chains.length === 0) {
    return { scenarios: s.scenarios, stashedId: null };
  }
  const id = s.activeId ?? makeScenarioId();
  return {
    scenarios: upsertScenario(s.scenarios, { id, name: s.activeName, elements, chains }),
    stashedId: id,
  };
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set) => ({
      scenarios: [],
      activeId: null,
      activeName: UNTITLED_NAME,

      newPlan: () =>
        set((s) => {
          const { scenarios } = stashCurrent(s);
          useBriefingStore.getState().replacePlan([], []);
          return { scenarios, activeId: null, activeName: UNTITLED_NAME };
        }),

      saveAs: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return s;
          const { elements, chains } = useBriefingStore.getState();
          const id = makeScenarioId();
          return {
            scenarios: upsertScenario(s.scenarios, { id, name: trimmed, elements, chains }),
            activeId: id,
            activeName: trimmed,
          };
        }),

      loadScenario: (id) =>
        set((s) => {
          const target = s.scenarios.find((sc) => sc.id === id);
          if (!target) return s;
          // Auto-save the outgoing plan first — never lose data on switch.
          const { scenarios } = stashCurrent(s);
          const saved = scenarios.find((sc) => sc.id === id) ?? target;
          useBriefingStore.getState().replacePlan(saved.data.elements, saved.data.chains);
          return { scenarios, activeId: saved.id, activeName: saved.name };
        }),

      rename: (id, name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return s;
          return {
            scenarios: renameScenario(s.scenarios, id, trimmed),
            activeName: s.activeId === id ? trimmed : s.activeName,
          };
        }),

      duplicate: (id) => set((s) => ({ scenarios: duplicateScenario(s.scenarios, id).list })),

      remove: (id) =>
        set((s) => ({
          scenarios: removeScenario(s.scenarios, id),
          // Deleting the active entry keeps the working plan on screen, it
          // just becomes "unsaved" again (name retained for context).
          activeId: s.activeId === id ? null : s.activeId,
        })),
    }),
    {
      name: "cyber-sandbox-scenarios-v1",
      version: 1,
      migrate: (persisted) => persisted as ScenarioState,
      // Validate persisted entries on every hydration (reusing the plan-file
      // validator) so a corrupt entry can't wedge the whole registry.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ScenarioState>;
        return {
          ...current,
          scenarios: sanitizeRegistry(p.scenarios),
          activeId: typeof p.activeId === "string" ? p.activeId : null,
          activeName: typeof p.activeName === "string" && p.activeName ? p.activeName : UNTITLED_NAME,
        };
      },
      partialize: (s) =>
        ({ scenarios: s.scenarios, activeId: s.activeId, activeName: s.activeName }) as ScenarioState,
      skipHydration: true,
    },
  ),
);
