import { ApprovalStatus } from '../types/state';
import { pendingAnalyses } from '../store/pendingAnalyses';

/**
 * submit_approval — Called by the dashboard widget's Approve/Reject buttons.
 * Never called directly by the agent.
 */
export function submitApproval(input: {
  analysisId: string;
  decision: 'approved' | 'rejected';
}): { status: ApprovalStatus } {
  const { analysisId, decision } = input;

  if (!pendingAnalyses.has(analysisId)) {
    throw new Error(`ANALYSIS_NOT_FOUND: no analysis with id "${analysisId}"`);
  }

  const current = pendingAnalyses.getStatus(analysisId);
  if (current !== 'pending') {
    throw new Error(`ALREADY_DECIDED: analysis "${analysisId}" already has status "${current}"`);
  }

  pendingAnalyses.updateStatus(analysisId, decision);

  return { status: decision };
}

/**
 * check_approval_status — Called by the Coordinator to poll for a decision.
 */
export function checkApprovalStatus(input: {
  analysisId: string;
}): { status: ApprovalStatus } {
  const { analysisId } = input;

  if (!pendingAnalyses.has(analysisId)) {
    throw new Error(`ANALYSIS_NOT_FOUND: no analysis with id "${analysisId}"`);
  }

  return { status: pendingAnalyses.getStatus(analysisId) as ApprovalStatus };
}
