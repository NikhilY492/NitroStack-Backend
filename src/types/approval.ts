/**
 * Approval-related types for managing human review and decision flow.
 * 
 * The approval status tracks the lifecycle of an infrastructure analysis
 * from initial presentation to human decision.
 */

/**
 * Approval status for an infrastructure analysis.
 * Transitions: pending → approved | rejected
 */
export type ApprovalStatus = "pending" | "approved" | "rejected";

/**
 * Request to submit an approval decision.
 * Called by the dashboard widget's Approve/Reject buttons.
 */
export interface ApprovalRequest {
  /**
   * The analysis ID being approved or rejected.
   */
  readonly analysisId: string;

  /**
   * The human's decision.
   */
  readonly decision: "approved" | "rejected";

  /**
   * Optional comment from the approver.
   */
  readonly comment?: string;

  /**
   * Timestamp of the decision.
   */
  readonly timestamp?: string;
}

/**
 * Response from submitting an approval decision.
 */
export interface ApprovalResponse {
  /**
   * The new status after the decision.
   */
  readonly status: ApprovalStatus;

  /**
   * Confirmation message.
   */
  readonly message?: string;
}

/**
 * Current approval status for polling.
 */
export interface ApprovalStatusResponse {
  /**
   * Current status.
   */
  readonly status: ApprovalStatus;

  /**
   * When the status last changed.
   */
  readonly lastUpdated?: string;

  /**
   * Optional comment if rejected.
   */
  readonly comment?: string;
}

/**
 * Complete approval record including decision metadata.
 */
export interface ApprovalRecord {
  /**
   * Analysis ID this approval pertains to.
   */
  readonly analysisId: string;

  /**
   * Current approval status.
   */
  readonly status: ApprovalStatus;

  /**
   * When the analysis was initially presented (status became "pending").
   */
  readonly presentedAt: string;

  /**
   * When the decision was made (if not still pending).
   */
  readonly decidedAt?: string;

  /**
   * Who made the decision (if tracked).
   */
  readonly decidedBy?: string;

  /**
   * Optional comment from the decision maker.
   */
  readonly comment?: string;

  /**
   * Extensible metadata.
   */
  readonly metadata?: Record<string, unknown>;
}
