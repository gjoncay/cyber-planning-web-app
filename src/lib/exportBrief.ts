import { PlanElement, ThreatTier } from "@/types";
import { TIER_ORDER, TIER_META, TIER_GROUPS } from "@/lib/oakoc";
import logoImg from "../../chinook-logo.png";

/** Fetch the (transparent) logo and inline it as a data URI so the exported
   document is fully self-contained. Returns null if it can't be loaded. */
async function logoDataUri(): Promise<string | null> {
  try {
    const res = await fetch(logoImg.src);
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* Literal hex palette — this is a standalone document, so no CSS vars. */
const INK = "#1d1f1d";
const SECONDARY = "#55605a";
const MUTED = "#8c9088";
const BORDER = "#e4dbcd";
const BG = "#f5efe6";
const SURFACE = "#fffdf9";
const PINE = "#58855f";
const TAN = "#e0882f";

/* Tier → literal accent hex (TIER_META.color references CSS vars unavailable here). */
const TIER_COLOR: Record<ThreatTier, string> = {
  "avenue-of-approach": "#e0882f",
  "cover-concealment": "#a855f7",
  "key-terrain": "#58855f",
  observation: "#4f8ef7",
  obstacle: "#14b8a6",
};

/* Group divider colors — mirror TIER_GROUPS but with literal hex. */
const GROUP_COLOR: Record<string, string> = {
  adversary: "#ef4444",
  objective: TAN,
  defender: PINE,
};

/** Escape user-supplied text so a stray < or & can't break the document. */
function esc(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Light rgba tint of a #rrggbb hex at the given alpha. */
function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Comma + "and" joined list of bolded, escaped element names. */
function nameList(names: string[]): string {
  return names
    .map((n, i) => {
      const sep = i < names.length - 2 ? ", " : i === names.length - 2 ? " and " : "";
      return `<strong>${esc(n)}</strong>${sep}`;
    })
    .join("");
}

/** Replicate BriefingLayout.renderStory() as prose; omit empty layers. */
function renderStory(elements: PlanElement[]): string {
  const namesIn = (tier: ThreatTier) =>
    elements.filter((el) => el.tier === tier).map((el) => el.name);

  const avenue = namesIn("avenue-of-approach");
  const cover = namesIn("cover-concealment");
  const key = namesIn("key-terrain");
  const obs = namesIn("observation");
  const obstacle = namesIn("obstacle");

  const adv: string[] = [];
  if (avenue.length) adv.push(`reaches the environment through ${nameList(avenue)}`);
  if (cover.length) adv.push(`stays hidden with ${nameList(cover)}`);
  if (key.length) adv.push(`targets ${nameList(key)}`);

  const def: string[] = [];
  if (obs.length) def.push(`observes with ${nameList(obs)}`);
  if (obstacle.length) def.push(`blocks with ${nameList(obstacle)}`);

  if (adv.length === 0 && def.length === 0) return "";

  // Mirror joinClauses: comma-separate, "and" before the last clause.
  const join = (clauses: string[]) =>
    clauses
      .map((c, i) => (i === 0 ? c : i === clauses.length - 1 ? `, and ${c}` : `, ${c}`))
      .join("");

  const parts: string[] = [];
  if (adv.length) parts.push(`The adversary ${join(adv)}.`);
  if (def.length) parts.push(`The defender ${join(def)}.`);

  return `<p class="story">${parts.join(" ")}</p>`;
}

/** Count unique CVEs and how many are actively exploited per metrics. */
function cveStats(elements: PlanElement[]): { unique: number; exploited: number } {
  const all = new Set<string>();
  const exploited = new Set<string>();
  for (const el of elements) {
    for (const cve of el.cves) {
      all.add(cve);
      if (el.metrics?.[cve]?.isExploited) exploited.add(cve);
    }
  }
  return { unique: all.size, exploited: exploited.size };
}

/** Per-element plain-language vuln read. */
function vulnRead(el: PlanElement): string {
  const n = el.cves.length;
  if (n === 0) return "";
  const k = el.cves.filter((c) => el.metrics?.[c]?.isExploited).length;
  const v = `${n} ${n === 1 ? "vulnerability" : "vulnerabilities"}`;
  const e = `${k} actively exploited`;
  return `${v} · ${e}`;
}

function renderElement(el: PlanElement, color: string): string {
  const techniques = (el.techniques ?? [])
    .map((t) => (t.name ? `${esc(t.id)} ${esc(t.name)}` : esc(t.id)))
    .join("  ·  ");
  const vuln = vulnRead(el);

  return `<article class="element" style="border-left-color:${color}">
    <div class="el-name">${esc(el.name)}</div>
    <p class="el-desc">${esc(el.description)}</p>
    ${techniques ? `<div class="techniques">${techniques}</div>` : ""}
    ${vuln ? `<div class="vuln">${vuln}</div>` : ""}
  </article>`;
}

function renderLayer(tier: ThreatTier, elements: PlanElement[]): string {
  const meta = TIER_META[tier];
  const color = TIER_COLOR[tier];
  const items = elements.filter((el) => el.tier === tier);

  const body =
    items.length === 0
      ? `<div class="empty">No elements in this layer</div>`
      : items.map((el) => renderElement(el, color)).join("");

  return `<section class="layer" style="border-left-color:${color};background:${tint(color, 0.06)}">
    <div class="layer-head">
      <div class="step" style="color:${color}">${meta.step}</div>
      <div class="layer-title">
        <div class="layer-name">${esc(meta.name)} <span class="layer-brief" style="color:${color}">— ${esc(meta.brief)}</span></div>
        <div class="layer-def">${esc(meta.definition)}</div>
      </div>
    </div>
    <div class="layer-body">${body}</div>
  </section>`;
}

function renderGroups(elements: PlanElement[]): string {
  return TIER_GROUPS.map((group) => {
    const color = GROUP_COLOR[group.role] ?? PINE;
    const tiers = group.tiers
      .filter((t) => TIER_ORDER.includes(t))
      .map((tier) => renderLayer(tier, elements))
      .join("");
    return `<div class="group">
      <div class="group-divider">
        <span class="group-bar" style="background:${color}"></span>
        <span class="group-label" style="color:${color}">${esc(group.label)}</span>
        <span class="group-rule"></span>
      </div>
      ${tiers}
    </div>`;
  }).join("");
}

const STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: ${BG};
    color: ${INK};
    font-family: "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
  .doc { max-width: 820px; margin: 0 auto; padding: 48px 28px 64px; }
  .masthead { text-align: center; margin-bottom: 28px; }
  .logo { height: 58px; width: auto; display: block; margin: 0 auto 12px; }
  .eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
    color: ${TAN};
  }
  .wordmark { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; margin: 6px 0 4px; }
  .wordmark .chinook { color: ${INK}; }
  .wordmark .cyber { color: ${PINE}; }
  .dateline { font-size: 12px; color: ${MUTED}; }
  .story {
    max-width: 680px; margin: 18px auto 0; text-align: center;
    font-size: 15px; color: ${SECONDARY}; line-height: 1.6;
  }
  .story strong { color: ${INK}; font-weight: 600; }
  .glance {
    margin: 22px auto 0; max-width: 680px; text-align: center;
    font-size: 12.5px; color: ${SECONDARY};
    border-top: 1px solid ${BORDER}; border-bottom: 1px solid ${BORDER};
    padding: 12px 0;
  }
  .glance strong { color: ${INK}; font-weight: 700; }
  .group { margin-top: 30px; }
  .group-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .group-bar { width: 4px; height: 16px; border-radius: 4px; flex: none; }
  .group-label { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; flex: none; }
  .group-rule { flex: 1; height: 1px; background: ${BORDER}; }
  .layer {
    background: ${SURFACE};
    border: 1px solid ${BORDER};
    border-left: 3px solid ${PINE};
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 14px;
  }
  .layer-head { display: flex; gap: 12px; align-items: flex-start; }
  .step { font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 16px; font-weight: 700; line-height: 1.2; flex: none; }
  .layer-name { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: ${INK}; }
  .layer-brief { font-size: 12.5px; font-weight: 600; font-style: italic; }
  .layer-def { font-size: 12px; color: ${SECONDARY}; margin-top: 3px; line-height: 1.5; }
  .layer-body { margin-top: 12px; display: grid; gap: 10px; }
  .element {
    background: ${BG};
    border: 1px solid ${BORDER};
    border-left: 3px solid ${PINE};
    border-radius: 8px;
    padding: 11px 13px;
  }
  .el-name { font-size: 13.5px; font-weight: 700; color: ${INK}; }
  .el-desc { margin: 4px 0 0; font-size: 12.5px; color: ${SECONDARY}; line-height: 1.5; }
  .techniques {
    margin-top: 7px; font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px; color: ${MUTED}; line-height: 1.5;
  }
  .vuln { margin-top: 6px; font-size: 11.5px; font-weight: 600; color: ${SECONDARY}; }
  .empty { font-size: 12px; color: ${MUTED}; font-style: italic; padding: 6px 0; }
  .footer {
    margin-top: 40px; padding-top: 16px; border-top: 1px solid ${BORDER};
    text-align: center; font-size: 11px; color: ${MUTED};
  }
  @media print {
    body { background: #fff; }
    .doc { max-width: none; padding: 0 12px; }
    .layer, .element { break-inside: avoid; }
    .group-divider { break-after: avoid; }
  }
`;

export async function exportBriefing(elements: PlanElement[]): Promise<void> {
  const generated = new Date().toLocaleDateString();
  const { unique, exploited } = cveStats(elements);
  const logo = await logoDataUri();

  const story = renderStory(elements);
  const groups = renderGroups(elements);

  const glance = `<div class="glance">
    <strong>${elements.length}</strong> ${elements.length === 1 ? "element" : "elements"}
    · <strong>${unique}</strong> ${unique === 1 ? "unique CVE" : "unique CVEs"}
    · <strong>${exploited}</strong> actively exploited (CISA KEV)
  </div>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Chinook Cyber — OAKOC Threat Briefing</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
<style>${STYLES}</style>
</head>
<body>
<div class="doc">
  <header class="masthead">
    ${logo ? `<img class="logo" src="${logo}" alt="Chinook Cyber" />` : ""}
    <div class="eyebrow">OAKOC Threat Briefing</div>
    <div class="wordmark"><span class="chinook">Chinook</span> <span class="cyber">Cyber</span></div>
    <div class="dateline">Generated ${esc(generated)}</div>
  </header>
  ${story}
  ${glance}
  ${groups}
  <footer class="footer">
    Generated by Chinook Cyber · Sourced from CISA KEV / FIRST EPSS · ${esc(generated)}
  </footer>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "oakoc-briefing.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
