/**
 * Policy-related types for the Policy Validator stage.
 * 
 * These types support company policy validation against candidate architectures
 * and represent the output of the read_company_policies tool.
 */

/**
 * A single policy rule from company policy definitions.
 */
export interface PolicyRule {
  /**
   * Unique identifier for this policy rule.
   */
  readonly id: string;

  /**
   * Human-readable label for the policy.
   */
  readonly label: string;

  /**
   * Detailed description of what this policy enforces.
   */
  readonly description: string;

  /**
   * Environments this policy applies to (e.g., ["dev"], ["prod"], ["dev", "staging", "prod"]).
   */
  readonly appliesTo: readonly string[];

  /**
   * Optional severity level.
   */
  readonly severity?: PolicySeverity;

  /**
   * Extensible metadata.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Severity levels for policy rules.
 */
export type PolicySeverity = "critical" | "high" | "medium" | "low" | "info";

/**
 * Result of checking a single candidate against a single policy rule.
 */
export interface PolicyCheck {
  /**
   * Reference to the policy rule ID.
   */
  readonly policyId: string;

  /**
   * Human-readable label from the policy rule.
   */
  readonly label: string;

  /**
   * Whether the candidate passed this policy check.
   */
  readonly passed: boolean;

  /**
   * Optional reason for failure (populated if passed is false).
   */
  readonly reason?: string;

  /**
   * Optional severity (inherited from the policy rule).
   */
  readonly severity?: PolicySeverity;
}

/**
 * Complete policy evaluation for a single candidate.
 * Contains all policy checks for one architecture.
 */
export interface PolicyEvaluation {
  /**
   * The candidate ID being evaluated.
   */
  readonly candidateId: string;

  /**
   * All policy checks performed against this candidate.
   */
  readonly checks: readonly PolicyCheck[];

  /**
   * Overall pass rate (0.0 to 1.0).
   */
  readonly passRate: number;

  /**
   * Whether all critical policies passed.
   */
  readonly criticalPoliciesPassed: boolean;

  /**
   * Number of policies passed.
   */
  readonly passedCount: number;

  /**
   * Number of policies failed.
   */
  readonly failedCount: number;
}

/**
 * Policy validation results for all candidates in a session.
 * Maps candidate ID to its policy evaluation.
 */
export interface PolicyResults {
  /**
   * Policy evaluation per candidate, keyed by candidate ID.
   */
  readonly [candidateId: string]: readonly PolicyCheck[];
}

/**
 * Summary of policy validation across all candidates.
 * Used by the Coordinator to make tradeoff decisions.
 */
export interface PolicyValidationSummary {
  /**
   * Total number of policy rules evaluated.
   */
  readonly totalRules: number;

  /**
   * Number of candidates that passed all critical policies.
   */
  readonly candidatesPassingCritical: number;

  /**
   * Number of candidates that passed all policies.
   */
  readonly candidatesPassingAll: number;

  /**
   * Candidate IDs ranked by policy pass rate (highest first).
   */
  readonly complianceRanking: readonly string[];
}
