import * as fs from 'fs';
import * as path from 'path';
import { pendingAnalyses } from '../store/pendingAnalyses';
import { MANAGED_BLOCK_START, MANAGED_BLOCK_END } from './terraformGenerator';

/**
 * Writes approved HCL to disk inside a managed marker block.
 * Idempotent: if the block already exists, it replaces it.
 * Only callable once status is "approved".
 *
 * Target file: sample-project/main.tf
 */
export function writeApprovedChanges(input: {
  analysisId: string;
}): { success: boolean; filesWritten: string[] } {
  const { analysisId } = input;

  const analysis = pendingAnalyses.get(analysisId);

  if (!analysis) {
    throw new Error(`NOT_APPROVED: analysis "${analysisId}" not found`);
  }

  if (analysis.status !== 'approved') {
    throw new Error(
      `NOT_APPROVED: analysis "${analysisId}" has status "${analysis.status}" — must be "approved" before writing`
    );
  }

  const hcl = analysis.terraform.hcl;
  const managedContent = `\n${MANAGED_BLOCK_START}\n${hcl}\n${MANAGED_BLOCK_END}\n`;

  const sampleProjectDir = path.resolve(
    process.env.SAMPLE_PROJECT_PATH ?? './sample-project'
  );

  if (!fs.existsSync(sampleProjectDir)) {
    fs.mkdirSync(sampleProjectDir, { recursive: true });
  }

  const targetFile = path.join(sampleProjectDir, 'main.tf');

  try {
    let existingContent = fs.existsSync(targetFile)
      ? fs.readFileSync(targetFile, 'utf-8')
      : '';

    // Remove existing managed block if present (idempotent write)
    const startIdx = existingContent.indexOf(MANAGED_BLOCK_START);
    const endIdx = existingContent.indexOf(MANAGED_BLOCK_END);

    if (startIdx !== -1 && endIdx !== -1) {
      existingContent =
        existingContent.slice(0, startIdx) +
        existingContent.slice(endIdx + MANAGED_BLOCK_END.length);
    }

    const finalContent = existingContent.trimEnd() + managedContent;
    fs.writeFileSync(targetFile, finalContent, 'utf-8');

    return { success: true, filesWritten: [targetFile] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`WRITE_FAILURE: ${msg}`);
  }
}
