import * as fs from 'fs';
import * as path from 'path';
import {
  GenerateCandidatesInput,
  ArchitectureCandidate,
  ComputeOption,
  DatabaseOption,
  InstanceType,
} from '../types/state';

interface CatalogTemplate {
  id: string;
  label: string;
  compute: ComputeOption;
  database: DatabaseOption;
  cache: boolean;
  scaling: 'auto' | 'fixed';
  instanceType: InstanceType;
  description: string;
}

interface Catalog {
  candidateTemplates: CatalogTemplate[];
  workloadFit: Record<string, { recommended: ComputeOption[]; discouraged: ComputeOption[] }>;
}

let catalogCache: Catalog | null = null;

function loadCatalog(): Catalog {
  if (catalogCache) return catalogCache;
  const catalogPath = path.resolve(
    process.env.KNOWLEDGE_BASE_PATH ?? './knowledge',
    'compute-catalog.json'
  );
  catalogCache = JSON.parse(fs.readFileSync(catalogPath, 'utf-8')) as Catalog;
  return catalogCache;
}

/**
 * Generates exactly 3 structurally distinct, unpriced architecture candidates.
 *
 * Strategy:
 *   1. Load the MVP catalog templates.
 *   2. Filter out templates that violate hard constraints (e.g. lambda for cpu-intensive).
 *   3. Pick the 3 most structurally distinct candidates.
 *   4. If fewer than 3 remain after filtering, relax the least-critical constraint
 *      (cache → off, scaling → auto) and flag this in the candidate description.
 *
 * Returns: exactly 3 ArchitectureCandidate objects (monthlyCost not yet set).
 */
export function generateCandidateArchitectures(
  input: GenerateCandidatesInput
): { candidates: ArchitectureCandidate[]; fallbackUsed?: boolean } {
  const { requirements, constraints } = input;
  const catalog = loadCatalog();

  let templates = [...catalog.candidateTemplates];

  // Apply workload-fit discouraged filters
  for (const classification of requirements.classification) {
    const fit = catalog.workloadFit[classification];
    if (fit) {
      templates = templates.filter(t => !fit.discouraged.includes(t.compute));
    }
  }

  // Apply scaling constraint: prod must have auto-scaling
  if (constraints.environment === 'prod') {
    templates = templates.filter(t => t.scaling === 'auto');
  }

  let fallbackUsed = false;

  // If fewer than 3, relax constraints (remove cache filter, allow fixed scaling)
  if (templates.length < 3) {
    fallbackUsed = true;
    templates = [...catalog.candidateTemplates];

    // Only keep non-discouraged compute for cpu-intensive
    if (requirements.classification.includes('cpu-intensive')) {
      templates = templates.filter(t => t.compute !== 'lambda');
    }
  }

  // Ensure structural diversity: pick one per compute type if possible
  const picked: CatalogTemplate[] = [];
  const seenCompute = new Set<string>();
  const seenDb = new Set<string>();

  // First pass: maximize diversity
  for (const t of templates) {
    if (picked.length >= 3) break;
    const key = `${t.compute}:${t.database}:${t.cache}`;
    if (!seenCompute.has(t.compute) || !seenDb.has(t.database)) {
      picked.push(t);
      seenCompute.add(t.compute);
      seenDb.add(t.database);
    }
    void key; // suppress unused warning
  }

  // Second pass: fill remaining slots
  for (const t of templates) {
    if (picked.length >= 3) break;
    if (!picked.includes(t)) {
      picked.push(t);
    }
  }

  // If still < 3, just take the first 3 from the full catalog
  if (picked.length < 3) {
    const fullCatalog = catalog.candidateTemplates;
    for (const t of fullCatalog) {
      if (picked.length >= 3) break;
      if (!picked.includes(t)) picked.push(t);
    }
    fallbackUsed = true;
  }

  const candidates: ArchitectureCandidate[] = picked.slice(0, 3).map((t, i) => ({
    id: `cand-${String.fromCharCode(97 + i)}`, // cand-a, cand-b, cand-c
    label: t.label,
    compute: t.compute,
    database: t.database,
    cache: t.cache,
    scaling: t.scaling,
    instanceType: t.instanceType,
    description: fallbackUsed
      ? `${t.description} [Note: constraints were relaxed to generate 3 candidates]`
      : t.description,
  }));

  return { candidates, fallbackUsed };
}
