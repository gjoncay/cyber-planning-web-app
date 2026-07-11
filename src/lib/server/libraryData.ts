import "server-only";
import type { Analytic, DataComponent, DetectionStrategy, Mitigation, D3fendTechnique } from "@/lib/api";
import detectionsData from "@/data/detections.json";
import mitigationsData from "@/data/mitigations.json";
import datacomponentsData from "@/data/datacomponents.json";
import analyticsData from "@/data/analytics.json";
import d3fendData from "@/data/d3fend_lite.json";

/* Static imports + module-level prebuilt arrays: the JSON is parsed once at
   build/first-import instead of fs.readFile + JSON.parse per request
   (mirrors the pattern in ./attackData.ts). */
const detections = detectionsData as DetectionStrategy[];
const mitigations = mitigationsData as Mitigation[];
const datacomponents = datacomponentsData as DataComponent[];
const analytics = analyticsData as Analytic[];
const d3fend = d3fendData as D3fendTechnique[];

/** Every empty-query browse response is capped at 50 rows. */
export const DEFAULT_LIMIT = 50;

/** Reverse index: ATT&CK technique id -> D3FEND techniques that mitigate it. */
const d3fendByMitigated = new Map<string, D3fendTechnique[]>();
for (const tech of d3fend) {
  for (const attackId of tech.mitigates) {
    const key = attackId.toUpperCase();
    const list = d3fendByMitigated.get(key);
    if (list) list.push(tech);
    else d3fendByMitigated.set(key, [tech]);
  }
}

export function searchDetections(q: string, limit = DEFAULT_LIMIT): DetectionStrategy[] {
  if (!q) return detections.slice(0, limit);
  return detections
    .filter((d) => d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function searchMitigations(q: string, limit = DEFAULT_LIMIT): Mitigation[] {
  if (!q) return mitigations.slice(0, limit);
  return mitigations
    .filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function searchDataComponents(q: string, limit = DEFAULT_LIMIT): DataComponent[] {
  if (!q) return datacomponents.slice(0, limit);
  return datacomponents
    .filter((dc) => dc.id.toLowerCase().includes(q) || dc.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function searchAnalytics(q: string, limit = DEFAULT_LIMIT): Analytic[] {
  if (!q) return analytics.slice(0, limit);
  return analytics
    .filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        (a.relatedDetection !== null && a.relatedDetection.toLowerCase().includes(q)) ||
        a.description.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export function searchD3fend(q: string, limit = DEFAULT_LIMIT): D3fendTechnique[] {
  if (!q) return d3fend.slice(0, limit);
  return d3fend
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

/** D3FEND techniques mitigating any of the given ATT&CK technique ids. */
export function d3fendForAttackIds(attackIds: string[]): D3fendTechnique[] {
  const seen = new Set<string>();
  const results: D3fendTechnique[] = [];
  for (const raw of attackIds) {
    const hits = d3fendByMitigated.get(raw.trim().toUpperCase()) ?? [];
    for (const tech of hits) {
      if (!seen.has(tech.id)) {
        seen.add(tech.id);
        results.push(tech);
      }
    }
  }
  return results;
}
