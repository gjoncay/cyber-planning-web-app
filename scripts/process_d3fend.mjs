import fs from 'fs';
import path from 'path';

const RAW_DIR = path.join(process.cwd(), 'D3FEND');
const OUT_FILE = path.join(process.cwd(), 'src', 'data', 'd3fend_lite.json');

async function processData() {
  console.log("Loading D3FEND ontology...");
  const d3fendRaw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'd3fend.json'), 'utf8'));
  
  console.log("Loading D3FEND mappings...");
  const mappingsRaw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'd3fend-full-mappings.json'), 'utf8'));

  const techMap = new Map(); // d3f:TechniqueId -> { ...details }

  // 1. Extract definitions from ontology
  for (const node of d3fendRaw['@graph']) {
    if (node['d3f:d3fend-id']) {
      const iriId = node['@id'].replace('d3f:', '');
      techMap.set(iriId, {
        id: node['d3f:d3fend-id'],
        name: node['rdfs:label'] || node['skos:prefLabel'],
        description: node['d3f:definition'] || "",
        mitigates: new Set(),
        category: "D3FEND Technique",
      });
    }
  }

  // 2. Link mappings
  console.log("Parsing mappings...");
  for (const binding of mappingsRaw.results.bindings) {
    if (binding.def_tech && binding.off_tech_id) {
      const defTechIri = binding.def_tech.value.split('#')[1];
      const offTechId = binding.off_tech_id.value;
      const topLabel = binding.top_def_tech_label?.value;
      
      const tech = techMap.get(defTechIri);
      if (tech) {
        tech.mitigates.add(offTechId);
        if (topLabel && tech.category === "D3FEND Technique") {
          tech.category = topLabel; // e.g. 'Credential Hardening'
        }
      }
    }
  }

  // 3. Format output
  const output = [];
  for (const [iri, tech] of techMap.entries()) {
    output.push({
      id: tech.id,
      name: tech.name,
      description: tech.description.replace(/\n/g, ' ').trim(),
      category: tech.category,
      mitigates: Array.from(tech.mitigates)
    });
  }

  output.sort((a, b) => a.id.localeCompare(b.id));

  // Ensure output dir exists
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));

  console.log(`Successfully wrote ${output.length} D3FEND techniques to ${OUT_FILE}`);
}

processData().catch(console.error);
