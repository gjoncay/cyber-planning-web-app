import { ThreatTier } from "@/types";

/* OAKOC adapted to the cyber domain, ordered as defense-in-depth — the adversary
   arrives at the surface (Avenues of Approach) and works toward the Key Terrain.
   This top-to-bottom order is the story the briefing tells. */
export const TIER_ORDER: ThreatTier[] = [
  "avenue-of-approach",
  "observation",
  "obstacle",
  "key-terrain",
  "cover-concealment",
];

export interface TierMeta {
  /** Depth position in the descent (drives the 01–05 markers). */
  step: string;
  /** Short name for chips and legends. */
  short: string;
  /** Full OAKOC name. */
  name: string;
  /** Plain-language cyber/IPOE definition — what this layer means. */
  definition: string;
  /** A one-line briefing read used in Brief mode. */
  brief: string;
  color: string;
  tint: string;
}

export const TIER_META: Record<ThreatTier, TierMeta> = {
  "avenue-of-approach": {
    step: "01",
    short: "Avenues",
    name: "Avenues of Approach",
    definition:
      "Routes an adversary can use to reach the network — exposed services, edge devices, and remote-access paths.",
    brief: "How the threat gets in.",
    color: "var(--color-avenue)",
    tint: "var(--tint-avenue)",
  },
  observation: {
    step: "02",
    short: "Observation",
    name: "Observation & Fields of Fire",
    definition:
      "Where you can sense activity — telemetry, logging, and detection coverage across the terrain.",
    brief: "Where we can see the threat.",
    color: "var(--color-observation)",
    tint: "var(--tint-observation)",
  },
  obstacle: {
    step: "03",
    short: "Obstacles",
    name: "Obstacles",
    definition:
      "Controls that slow or canalize an adversary — segmentation, MFA, WAF, and zero-trust policy.",
    brief: "What slows the threat down.",
    color: "var(--color-obstacle)",
    tint: "var(--tint-obstacle)",
  },
  "key-terrain": {
    step: "04",
    short: "Key Terrain",
    name: "Key Terrain",
    definition:
      "Assets whose loss is decisive — domain controllers, credential stores, and crown-jewel data.",
    brief: "What the threat is after.",
    color: "var(--color-key-terrain)",
    tint: "var(--tint-key-terrain)",
  },
  "cover-concealment": {
    step: "05",
    short: "Cover",
    name: "Cover & Concealment",
    definition:
      "Where activity can hide — encrypted channels, DNS tunneling, and living-off-the-land techniques.",
    brief: "How the threat stays hidden.",
    color: "var(--color-cover)",
    tint: "var(--tint-cover)",
  },
};

/** Friendly labels for the tier <select> in the form. */
export const TIER_LABELS: Record<ThreatTier, string> = {
  "avenue-of-approach": "01 · Avenues of Approach",
  observation: "02 · Observation & Fields of Fire",
  obstacle: "03 · Obstacles",
  "key-terrain": "04 · Key Terrain",
  "cover-concealment": "05 · Cover & Concealment",
};
