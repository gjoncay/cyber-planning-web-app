# Future Requirements

Deferred scope, captured so it isn't lost. Not yet built.

## Adversary-driven TTP import (the headline next feature)

Elements now carry **ATT&CK techniques (TTPs)** entered by hand. The next step is to
**start from an adversary and pull their TTPs automatically**, then reframe those
techniques into the OAKOC layers:

1. Pick a real **MITRE ATT&CK group** (this is the link to the sibling MITRE Diamond
   Dashboard — don't re-type the adversary).
2. Load that group's techniques.
3. Help the analyst **map each technique into an OAKOC layer** (e.g. T1021.002 SMB →
   Avenues of Approach; T1055 in-memory → Cover & Concealment), seeding elements.
4. Build the maneuver-vs-counter story from there.

### Open questions to resolve before building
- **ATT&CK data sourcing** — bundle a trimmed ATT&CK dataset in this app (build script,
  like the dashboard), connect to the sibling dashboard's data, or fetch STIX at runtime?
- Technique typeahead in the form, sourced from that same dataset.
- A suggested technique→OAKOC-layer mapping (by ATT&CK tactic) to speed up step 3.
- Attribution granularity: per-element, per-layer, or per-model? One adversary or several?

## Briefing export (parked — brainstormed)

Export the Brief view as a **standalone, self-contained HTML document** (logo embedded
as base64, inline Chinook styles) with a print stylesheet so "Save as PDF" works too.
Open decisions: executive vs. analyst detail, classification/TLP banner, report
title/author prompt, whole-model vs. selected layers.

## Other candidates
- Export a Brief as PDF / shareable link for leadership.
- Map elements to ATT&CK techniques and D3FEND countermeasures (shared vocabulary
  with the dashboard).
- Save / load multiple named briefing scenarios.
