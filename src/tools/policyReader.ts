import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PolicyRule } from '../types/state';

interface RawPolicyFile {
  version: string;
  rules: PolicyRule[];
}

/**
 * Reads company policy rules from knowledge/policy.yaml.
 * Falls back to empty rule set if file is missing or parse fails.
 */
export function readCompanyPolicies(): { rules: PolicyRule[]; fallback?: boolean } {
  const policyPath = path.resolve(
    process.env.KNOWLEDGE_BASE_PATH ?? './knowledge',
    'policy.yaml'
  );

  if (!fs.existsSync(policyPath)) {
    console.warn('[policyReader] policy.yaml not found — returning empty rule set');
    return { rules: [], fallback: true };
  }

  try {
    const raw = fs.readFileSync(policyPath, 'utf-8');
    const parsed = yaml.load(raw) as RawPolicyFile;

    if (!parsed?.rules || !Array.isArray(parsed.rules)) {
      throw new Error('YAML_PARSE_ERROR: "rules" key missing or not an array');
    }

    return { rules: parsed.rules };
  } catch (err) {
    console.error('[policyReader] Failed to parse policy.yaml:', err);
    return { rules: [], fallback: true };
  }
}
