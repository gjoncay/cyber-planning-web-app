import "server-only";
import { AttackAdversary, AttackTechnique, AttackSoftware } from "@/lib/attack";
import adversariesData from "@/data/attack/adversaries.json";
import techniquesData from "@/data/attack/techniques.json";
import softwareData from "@/data/attack/software.json";
import advTechData from "@/data/attack/adversary-techniques.json";
import advSoftData from "@/data/attack/adversary-software.json";

const adversaries = adversariesData as AttackAdversary[];
const techniques = techniquesData as AttackTechnique[];
const software = softwareData as AttackSoftware[];
const advTechniques = advTechData as Record<string, string[]>;
const advSoftware = advSoftData as Record<string, string[]>;

const techById = new Map(techniques.map((t) => [t.id, t]));
const softById = new Map(software.map((s) => [s.id, s]));

export function searchGroups(query: string, limit = 8): AttackAdversary[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const scored = adversaries
    .map((g) => {
      const name = g.name.toLowerCase();
      const alias = g.aliases.find((a) => a.toLowerCase().includes(q));
      let score = -1;
      if (g.id.toLowerCase() === q) score = 100;
      else if (name === q) score = 90;
      else if (name.startsWith(q)) score = 80;
      else if (name.includes(q)) score = 60;
      else if (alias) score = 40;
      else if (g.id.toLowerCase().includes(q)) score = 30;
      return { g, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || b.g.techniqueCount - a.g.techniqueCount)
    .slice(0, limit);
  return scored.map((x) => x.g);
}

export function searchTechniques(query: string, limit = 8): AttackTechnique[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const scored = techniques
    .map((t) => {
      const id = t.id.toLowerCase();
      const name = t.name.toLowerCase();
      let score = -1;
      if (id === q) score = 100;
      else if (id.includes(q)) score = 80;
      else if (name.startsWith(q)) score = 70;
      else if (name.includes(q)) score = 50;
      else if (t.parentName?.toLowerCase().includes(q)) score = 30;
      return { t, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id))
    .slice(0, limit);
  return scored.map((x) => x.t);
}

export function searchSoftware(query: string, limit = 8): AttackSoftware[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const scored = software
    .map((s) => {
      const id = s.id.toLowerCase();
      const name = s.name.toLowerCase();
      let score = -1;
      if (id === q) score = 100;
      else if (name === q) score = 90;
      else if (name.startsWith(q)) score = 80;
      else if (name.includes(q)) score = 60;
      else if (id.includes(q)) score = 30;
      return { s, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.s.id.localeCompare(b.s.id))
    .slice(0, limit);
  return scored.map((x) => x.s);
}

export function getGroup(id: string): { group: AttackAdversary; techniques: AttackTechnique[]; software: AttackSoftware[] } | null {
  const group = adversaries.find((g) => g.id.toLowerCase() === id.toLowerCase());
  if (!group) return null;
  const tIds = advTechniques[group.id] ?? [];
  const techs = tIds.map((tid) => techById.get(tid)).filter((t): t is AttackTechnique => !!t);
  const sIds = advSoftware[group.id] ?? [];
  const softs = sIds.map((sid) => softById.get(sid)).filter((s): s is AttackSoftware => !!s);
  return { group, techniques: techs, software: softs };
}
