import * as fs from 'fs';
import * as path from 'path';
import { ReadExistingInfraInput, ReadExistingInfraOutput, TerraformResource } from '../types/state';

/**
 * Reads existing Terraform files from a working directory.
 * Uses regex/marker-block extraction — NOT a full HCL parser (per MVP scope).
 *
 * Extracts: resource blocks → { type, name, attributes }
 * Gracefully handles missing dirs (treats as greenfield).
 */
export function readExistingInfrastructure(input: ReadExistingInfraInput): ReadExistingInfraOutput {
  const { workingDir } = input;

  const resolvedDir = path.resolve(workingDir);

  if (!fs.existsSync(resolvedDir)) {
    return { resources: [] };
  }

  const tfFiles = fs.readdirSync(resolvedDir).filter(f => f.endsWith('.tf'));

  if (tfFiles.length === 0) {
    return { resources: [] };
  }

  const resources: TerraformResource[] = [];

  for (const file of tfFiles) {
    const content = fs.readFileSync(path.join(resolvedDir, file), 'utf-8');

    // Extract resource blocks: resource "aws_xxx" "name" { ... }
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    let match: RegExpExecArray | null;

    while ((match = resourceRegex.exec(content)) !== null) {
      const [, type, name, body] = match;
      const attributes: Record<string, unknown> = {};

      // Extract simple key = "value" pairs
      const attrRegex = /^\s*(\w+)\s*=\s*"([^"]+)"/gm;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(body)) !== null) {
        attributes[attrMatch[1]] = attrMatch[2];
      }

      // Extract simple key = value (no quotes) pairs
      const attrRegexNoQuote = /^\s*(\w+)\s*=\s*([^\s"#][^\s#]*)/gm;
      while ((attrMatch = attrRegexNoQuote.exec(body)) !== null) {
        if (!(attrMatch[1] in attributes)) {
          attributes[attrMatch[1]] = attrMatch[2];
        }
      }

      resources.push({ type: type.trim(), name: name.trim(), attributes });
    }
  }

  return { resources };
}
