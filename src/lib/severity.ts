import { PlanElement, VulnerabilityMetrics } from "@/types";

/** EPSS percentile at or above which an element is considered high risk. */
export const HIGH_EPSS_THRESHOLD = 0.8;

/** True when the metrics entry holds real (successfully fetched) intel. */
export function metricsKnown(m?: VulnerabilityMetrics): m is VulnerabilityMetrics {
  return !!m && m.status !== "unknown";
}

export interface ElementSeverity {
  /** CVEs on this element that are actively exploited (CISA KEV). */
  kev: string[];
  /** Highest EPSS percentile (0..1) among CVEs with real metrics. */
  maxEpss: number;
  /** Total CVEs assigned to the element. */
  cveCount: number;
  /** CVEs whose enrichment failed — intel status is unknown, not "safe". */
  unknown: string[];
  /** KEV hit or EPSS percentile at/above the high-risk threshold. */
  isHot: boolean;
}

/**
 * Real severity read for an element, derived only from fetched KEV/EPSS
 * metrics (never from CVE-id arithmetic). CVEs whose enrichment failed are
 * reported separately in `unknown` and excluded from the KEV/EPSS numbers.
 */
export function elementSeverity(element: PlanElement): ElementSeverity {
  const kev: string[] = [];
  const unknown: string[] = [];
  let maxEpss = 0;

  for (const cve of element.cves) {
    const m = element.metrics?.[cve];
    if (m && m.status === "unknown") {
      unknown.push(cve);
      continue;
    }
    if (m?.isExploited) kev.push(cve);
    const p = m?.epssPercentile ?? 0;
    if (p > maxEpss) maxEpss = p;
  }

  return {
    kev,
    maxEpss,
    cveCount: element.cves.length,
    unknown,
    isHot: kev.length > 0 || maxEpss >= HIGH_EPSS_THRESHOLD,
  };
}
