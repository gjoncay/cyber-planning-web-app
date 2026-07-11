import fs from 'fs';
import path from 'path';

const RAW_DIR = path.join(process.cwd(), 'D3FEND');
const OUT_FILE = path.join(process.cwd(), 'src', 'data', 'd3fend_lite.json');

/** The seven D3FEND defensive tactics (ontology @ids without the d3f: prefix). */
const TACTIC_IDS = new Set(['Model', 'Harden', 'Detect', 'Isolate', 'Deceive', 'Evict', 'Restore']);

const PLACEHOLDER = 'D3FEND Technique';

function asArray(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function stripPrefix(id) {
  return typeof id === 'string' ? id.replace(/^d3f:/, '') : '';
}

async function processData() {
  console.log('Loading D3FEND ontology...');
  const d3fendRaw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'd3fend.json'), 'utf8'));

  console.log('Loading D3FEND mappings...');
  const mappingsRaw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'd3fend-full-mappings.json'), 'utf8'));

  const graph = d3fendRaw['@graph'];

  // Index every ontology node by its (prefix-stripped) @id so we can walk
  // rdfs:subClassOf chains up to a node that carries d3f:enables → tactic.
  const nodeById = new Map();
  for (const node of graph) {
    const id = stripPrefix(node['@id']);
    if (id && !id.startsWith('_:')) nodeById.set(id, node);
  }

  /** Resolve the D3FEND tactic (Detect/Harden/Isolate/…) for a technique node
      by following d3f:enables directly or via its superclass chain. */
  function tacticFor(nodeId, seen = new Set()) {
    if (!nodeId || seen.has(nodeId)) return null;
    seen.add(nodeId);
    if (TACTIC_IDS.has(nodeId)) return nodeId;
    const node = nodeById.get(nodeId);
    if (!node) return null;

    for (const enabled of asArray(node['d3f:enables'])) {
      const t = stripPrefix(enabled['@id'] ?? enabled);
      if (TACTIC_IDS.has(t)) return t;
    }
    for (const parent of asArray(node['rdfs:subClassOf'])) {
      const pid = stripPrefix(parent['@id'] ?? parent);
      if (!pid || pid.startsWith('_:') || pid === 'DefensiveTechnique') continue;
      const t = tacticFor(pid, seen);
      if (t) return t;
    }
    return null;
  }

  const techMap = new Map(); // iri id (e.g. FileAnalysis) -> { ...details }

  // 1. Extract definitions from the ontology, resolving each technique's
  //    real D3FEND tactic instead of the old "D3FEND Technique" placeholder.
  for (const node of graph) {
    if (node['d3f:d3fend-id']) {
      const iriId = stripPrefix(node['@id']);
      const tactic = tacticFor(iriId);
      techMap.set(iriId, {
        id: node['d3f:d3fend-id'],
        name: node['rdfs:label'] || node['skos:prefLabel'],
        description: node['d3f:definition'] || '',
        mitigates: new Set(),
        category: tactic ?? PLACEHOLDER,
      });
    }
  }

  // 2. Link ATT&CK mappings; use the SPARQL def_tactic_label as a fallback
  //    category for any technique the ontology walk couldn't classify.
  console.log('Parsing mappings...');
  for (const binding of mappingsRaw.results.bindings) {
    if (binding.def_tech && binding.off_tech_id) {
      const defTechIri = binding.def_tech.value.split('#')[1];
      const offTechId = binding.off_tech_id.value;
      const tacticLabel = binding.def_tactic_label?.value;

      const tech = techMap.get(defTechIri);
      if (tech) {
        tech.mitigates.add(offTechId);
        if (tacticLabel && tech.category === PLACEHOLDER) {
          tech.category = tacticLabel; // e.g. 'Harden'
        }
      }
    }
  }

  // 3. Format output. Anything still unclassified is an analytic-method node
  //    (D3A-* statistical/ML algorithms) that has no defensive tactic in the
  //    ontology — label it honestly rather than as a placeholder "technique".
  const output = [];
  for (const tech of techMap.values()) {
    output.push({
      id: tech.id,
      name: tech.name,
      description: tech.description.replace(/\n/g, ' ').trim(),
      category: tech.category === PLACEHOLDER ? 'Analytic Method' : tech.category,
      mitigates: Array.from(tech.mitigates),
    });
  }

  output.sort((a, b) => a.id.localeCompare(b.id));

  // Ensure output dir exists
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));

  const categorized = output.filter((t) => t.category !== PLACEHOLDER && t.category !== 'Analytic Method').length;
  const counts = {};
  for (const t of output) counts[t.category] = (counts[t.category] ?? 0) + 1;
  console.log(`Successfully wrote ${output.length} D3FEND techniques to ${OUT_FILE}`);
  console.log(`Categorized ${categorized}/${output.length} with a real D3FEND tactic:`, counts);
}

processData().catch(console.error);
