# Future Requirements

Deferred scope, captured so it isn't lost. Not yet built.

## Adversary attribution (deferred)

Re-introduce the ability to associate a **threat actor / adversary** with terrain
elements — but designed properly, not as a free-text field.

- Each element (or the model as a whole) can be attributed to one or more adversaries.
- Attribution should connect to the **MITRE Diamond Dashboard** (the sibling app),
  not be re-typed by hand: pick a real ATT&CK group, and pull its known techniques /
  targeted platforms to help pre-populate or validate the OAKOC layers.
- The `PlanElement` type intentionally leaves room for this; the previous free-text
  `threatActor` input was removed in the v2 redesign to keep the form focused.

### Open questions to resolve before building
- Attribution granularity: per-element, per-layer, or per-model?
- One adversary per model, or compare multiple?
- How the link to a dashboard actor is represented (id, deep link, embedded profile)?

## Other candidates
- Export a Brief as PDF / shareable link for leadership.
- Map elements to ATT&CK techniques and D3FEND countermeasures (shared vocabulary
  with the dashboard).
- Save / load multiple named briefing scenarios.
