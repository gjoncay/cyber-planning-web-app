import { ThreatTier } from "@/types";

export type OakocRole = "adversary" | "objective" | "defender";

/* OAKOC adapted to the cyber domain, ordered to tell the story the way an
   analyst reasons about it: the adversary maneuvers (Avenues of Approach, then
   Cover & Concealment) toward an objective (Key Terrain); the defender responds
   (Observation & Fields of Fire, then Obstacles). */
export const TIER_ORDER: ThreatTier[] = [
  "avenue-of-approach",
  "cover-concealment",
  "key-terrain",
  "observation",
  "obstacle",
];

export interface TierMeta {
  step: string;
  short: string;
  name: string;
  /** Whose side of the engagement this layer represents. */
  role: OakocRole;
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
    role: "adversary",
    definition:
      "Routes the adversary uses to reach and move through the network — exposed edge services, remote access, and lateral movement (e.g. SMB).",
    brief: "How the threat gets in and moves.",
    color: "var(--color-avenue)",
    tint: "var(--tint-avenue)",
  },
  "cover-concealment": {
    step: "02",
    short: "Cover",
    name: "Cover & Concealment",
    role: "adversary",
    definition:
      "How the adversary avoids detection — in-memory-only malware, encrypted channels, DNS tunneling, and living-off-the-land.",
    brief: "How the threat stays hidden.",
    color: "var(--color-cover)",
    tint: "var(--tint-cover)",
  },
  "key-terrain": {
    step: "03",
    short: "Key Terrain",
    name: "Key Terrain",
    role: "objective",
    definition:
      "The assets the adversary is after and the defender must hold — domain controllers, credential stores, and crown-jewel data.",
    brief: "What the threat is after.",
    color: "var(--color-key-terrain)",
    tint: "var(--tint-key-terrain)",
  },
  observation: {
    step: "04",
    short: "Observation",
    name: "Observation & Fields of Fire",
    role: "defender",
    definition:
      "How the defender senses the adversary — IAM logging, NetFlow, PCAP, and EDR telemetry across the terrain.",
    brief: "How we see the threat.",
    color: "var(--color-observation)",
    tint: "var(--tint-observation)",
  },
  obstacle: {
    step: "05",
    short: "Obstacles",
    name: "Obstacles",
    role: "defender",
    definition:
      "How the defender slows or stops the adversary — segmentation, MFA, SOAR playbooks, and DNS sinkholing.",
    brief: "How we slow the threat down.",
    color: "var(--color-obstacle)",
    tint: "var(--tint-obstacle)",
  },
};

export interface OakocGroup {
  role: OakocRole;
  label: string;
  /** Accent color for the group divider. */
  color: string;
  tiers: ThreatTier[];
}

/* The three acts of the story. Adversary actions are framed in threat-red,
   the contested objective in brand tan, the defensive response in brand pine. */
export const TIER_GROUPS: OakocGroup[] = [
  { role: "adversary", label: "Adversary maneuver", color: "#ef4444", tiers: ["avenue-of-approach", "cover-concealment"] },
  { role: "objective", label: "Objective", color: "var(--accent-secondary)", tiers: ["key-terrain"] },
  { role: "defender", label: "Defensive response", color: "var(--accent-primary)", tiers: ["observation", "obstacle"] },
];

/** Friendly labels for the tier <select> in the form. */
export const TIER_LABELS: Record<ThreatTier, string> = {
  "avenue-of-approach": "01 · Avenues of Approach",
  "cover-concealment": "02 · Cover & Concealment",
  "key-terrain": "03 · Key Terrain",
  observation: "04 · Observation & Fields of Fire",
  obstacle: "05 · Obstacles",
};
