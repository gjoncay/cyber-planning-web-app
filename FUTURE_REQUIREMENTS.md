# Future Requirements

Deferred scope, captured so it isn't lost.

## Done (shipped)
- ATT&CK techniques (TTPs) as first-class data on elements, with a fluid technique typeahead.
- **Adversary → OAKOC import**: pick a real ATT&CK group, pull its TTPs, map them into the
  OAKOC layers by tactic (one element per tactic). Data is synced from the sibling MITRE
  Diamond Dashboard via `npm run sync:attack` (see `scripts/sync-attack-data.mjs`).
- Standalone HTML briefing export (logo embedded, print-to-PDF friendly).

## Next candidates
- **Tighter dashboard integration.** Today the two apps share *data* (synced JSON). A deeper
  link would let an analyst jump from a dashboard actor straight into a seeded OAKOC model,
  or open an element's technique in the dashboard. Decide on a shared deploy / linking scheme.
- **Map defensive layers from D3FEND.** ATT&CK only populates the adversary + objective
  layers. Use the dashboard's `d3fend.json` to suggest Observation / Obstacle countermeasures
  for the imported techniques.
- **Adversary attribution on the model** — record which group(s) a model represents (one or
  several), shown in the header and the exported brief.
- **Save / load named briefing scenarios**; export options (executive vs. analyst detail,
  classification/TLP banner, report title/author).
- **Suggested technique re-tiering.** The tactic→OAKOC mapping is a heuristic; let analysts
  override per technique and remember it.
