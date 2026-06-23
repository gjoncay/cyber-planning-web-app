# CyberSandBox — OAKOC Cyber Planning Tool

An OAKOC-based Cyber Threat Intelligence **planning and modeling** surface. It applies
US Army intelligence-preparation-of-the-battlefield concepts (**OAKOC** / **IPOE**) to
cyber defense: analysts map their network as defended terrain, enrich it with live
vulnerability data, and present the result as a dual-lens threat briefing.

It is the operational-planning companion to the **MITRE Diamond Dashboard** (the
threat-actor *intelligence browser*). The two share the **Chinook Cyber** design system
so they read as one product family — see [Design](#design--family-resemblance).

## What it does

- **Defense-in-depth terrain.** The canvas is a cross-section of your network rendered
  as five stacked OAKOC strata — the adversary descends from the perimeter
  (*Avenues of Approach*) toward the *Key Terrain* (crown jewels), passing your
  *Observation* (telemetry), *Obstacles* (defenses) and any *Cover & Concealment*
  (evasion) channels. Tier order encodes depth.
- **Dual-Lens briefing.** A single toggle switches the whole view between:
  - **Tactical** — technical indicators: CVEs, IPs, KEV exploitation status.
  - **Strategic** — decision-maker view: FAIR-lite financial exposure and EPSS likelihood.
- **Live enrichment.** Assign a CVE to a terrain element and it's checked against the
  CISA KEV catalog and FIRST EPSS scores via server-side proxy routes.
- **Scrollytelling.** The briefing narrative is auto-generated from the model; clicking a
  terrain element in the prose glides the canvas camera to that node.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Zustand (persisted) ·
React Flow · React Markdown · lucide-react.

## Develop

```bash
npm install
npm run dev      # http://localhost:8096
npm run build    # production build
```

## Design & family resemblance

Styling is the portable **Chinook Cyber** system (`DESIGN_SYSTEM.md`): warm-sand / lifted-slate
surfaces, pine + tan accents, Inter for prose and JetBrains Mono for machine identifiers,
hairlines over heavy chrome, light/dark via a single `data-theme` attribute. All color is a
CSS variable — never a hardcoded hex.

The OAKOC tier palette deliberately reuses hues from the dashboard's ATT&CK / D3FEND
palettes so the two apps share a color *vocabulary*:

| Tier | Meaning | Color |
|------|---------|-------|
| Observation | our sensors / telemetry | detect-blue |
| Avenues of Approach | how the adversary gets in | brand tan |
| Obstacles | our defensive barriers | harden-teal |
| Key Terrain | the crown jewels | brand pine |
| Cover & Concealment | adversary evasion | stealth-purple |

## ATT&CK data & the MITRE Diamond Dashboard

The two apps share the same ATT&CK source data. This app derives small, queryable JSON
(groups, techniques, group→technique map) from the dashboard's processed STIX bundle:

```bash
npm run sync:attack   # reads ../mitre-diamond-dashboard/public/data/attack.json
                      # writes src/data/attack/*.json (committed, so the app is standalone)
```

That powers two features:
- **Technique typeahead** in the element form.
- **Import from ATT&CK** — pick a real threat group, pull its TTPs, and auto-map them into
  the OAKOC layers (by ATT&CK tactic). One element per tactic; defensive layers stay yours.

Deeper linking between the two apps is scoped in `FUTURE_REQUIREMENTS.md`.
