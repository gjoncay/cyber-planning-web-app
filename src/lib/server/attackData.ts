import "server-only";
import { AttackGroup, AttackTechnique } from "@/lib/attack";
import groupsData from "@/data/attack/groups.json";
import techniquesData from "@/data/attack/techniques.json";
import groupTechData from "@/data/attack/group-techniques.json";

const groups = groupsData as AttackGroup[];
const techniques = techniquesData as AttackTechnique[];
const groupTechniques = groupTechData as Record<string, string[]>;
const techById = new Map(techniques.map((t) => [t.id, t]));

export function searchGroups(query: string, limit = 8): AttackGroup[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const scored = groups
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

export function getGroup(id: string): { group: AttackGroup; techniques: AttackTechnique[] } | null {
  const group = groups.find((g) => g.id.toLowerCase() === id.toLowerCase());
  if (!group) return null;
  const ids = groupTechniques[group.id] ?? [];
  const techs = ids.map((tid) => techById.get(tid)).filter((t): t is AttackTechnique => !!t);
  return { group, techniques: techs };
}
