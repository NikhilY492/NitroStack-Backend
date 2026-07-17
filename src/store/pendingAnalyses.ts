import { InfrastructureAnalysis, ApprovalStatus } from '../types/state';

/**
 * In-memory store for pending/decided infrastructure analyses.
 * Keyed by analysisId (UUID).
 *
 * Lifecycle:
 *   present_analysis  → writes with status: "pending"
 *   submit_approval   → updates status to "approved" | "rejected"
 *   check_approval_status → reads status
 *   write_approved_changes → reads HCL, asserts status === "approved"
 */

const store = new Map<string, InfrastructureAnalysis>();

export const pendingAnalyses = {
  set(id: string, analysis: InfrastructureAnalysis): void {
    store.set(id, analysis);
  },

  get(id: string): InfrastructureAnalysis | undefined {
    return store.get(id);
  },

  updateStatus(id: string, status: ApprovalStatus): boolean {
    const analysis = store.get(id);
    if (!analysis) return false;
    store.set(id, { ...analysis, status });
    return true;
  },

  has(id: string): boolean {
    return store.has(id);
  },

  getStatus(id: string): ApprovalStatus | null {
    return store.get(id)?.status ?? null;
  },

  all(): InfrastructureAnalysis[] {
    return Array.from(store.values());
  },
};
