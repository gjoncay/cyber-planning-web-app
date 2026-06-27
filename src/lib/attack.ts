import { ThreatTier } from "@/types";

export interface AttackAdversary {
  id: string; // Gxxxx or Cxxxx
  name: string;
  aliases: string[];
  type: "group" | "campaign";
  techniqueCount: number;
  softwareCount: number;
}

export interface AttackSoftware {
  id: string; // Sxxxx
  name: string;
  description: string;
  platforms: string[];
  type: string;
  tactics?: string[];
}

export interface AttackTechnique {
  id: string; // Txxxx[.xxx]
  name: string;
  tactics: string[]; // kill-chain phase slugs
  isSub: boolean;
  parent?: string;
  parentName?: string;
}

/** ATT&CK tactic → OAKOC layer. ATT&CK techniques are all adversary actions,
   so they map to the adversary maneuver layers and the objective; the
   defensive layers (Observation, Obstacles) stay the analyst's own to fill. */
export const TACTIC_TO_TIER: Record<string, ThreatTier> = {
  reconnaissance: "avenue-of-approach",
  "resource-development": "avenue-of-approach",
  "initial-access": "avenue-of-approach",
  "lateral-movement": "avenue-of-approach",
  discovery: "avenue-of-approach",

  execution: "cover-concealment",
  persistence: "cover-concealment",
  "privilege-escalation": "cover-concealment",
  "defense-evasion": "cover-concealment",
  stealth: "cover-concealment",
  "defense-impairment": "cover-concealment",
  "command-and-control": "cover-concealment",

  "credential-access": "key-terrain",
  collection: "key-terrain",
  exfiltration: "key-terrain",
  impact: "key-terrain",
};

/** Human-readable ATT&CK tactic names (kill-chain order). */
export const TACTIC_NAMES: Record<string, string> = {
  reconnaissance: "Reconnaissance",
  "resource-development": "Resource Development",
  "initial-access": "Initial Access",
  execution: "Execution",
  persistence: "Persistence",
  "privilege-escalation": "Privilege Escalation",
  "defense-evasion": "Defense Evasion",
  stealth: "Defense Evasion",
  "defense-impairment": "Defense Impairment",
  "credential-access": "Credential Access",
  discovery: "Discovery",
  "lateral-movement": "Lateral Movement",
  collection: "Collection",
  "command-and-control": "Command & Control",
  exfiltration: "Exfiltration",
  impact: "Impact",
};

/** Pick the OAKOC tier for a technique from its first mapped tactic. */
export function tierForTechnique(t: AttackTechnique): ThreatTier {
  for (const phase of t.tactics) {
    if (TACTIC_TO_TIER[phase]) return TACTIC_TO_TIER[phase];
  }
  return "avenue-of-approach";
}

/** Pick the OAKOC tier for software based on its associated tactics. */
export function tierForSoftware(s: AttackSoftware): ThreatTier {
  if (s.tactics && s.tactics.length > 0) {
    for (const phase of s.tactics) {
      if (TACTIC_TO_TIER[phase]) return TACTIC_TO_TIER[phase];
    }
  }
  return "cover-concealment"; // Default for software if no tactic mapping
}

/** Pick the representative tactic slug used to group a technique into an element. */
export function tacticForTechnique(t: AttackTechnique): string {
  for (const phase of t.tactics) {
    if (TACTIC_TO_TIER[phase]) return phase;
  }
  return t.tactics[0] ?? "execution";
}
