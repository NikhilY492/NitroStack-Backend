/**
 * Coordinator stage configuration.
 */

import type { ExecutionRules } from "../common/ExecutionRules";
import { createExecutionRules } from "../common/ExecutionRules";

/**
 * Coordinator stage configuration.
 */
export interface CoordinatorConfig {
  /**
   * Execution rules.
   */
  readonly executionRules: ExecutionRules;

  /**
   * Minimum confidence threshold to recommend (0-1).
   */
  readonly minConfidenceThreshold: number;

  /**
   * Decision factors and their weights.
   */
  readonly decisionFactors: {
    readonly cost: number;
    readonly performance: number;
    readonly reliability: number;
    readonly scalability: number;
    readonly policyCompliance: number;
    readonly operationalComplexity: number;
  };

  /**
   * Whether to generate Terraform immediately.
   */
  readonly generateTerraformImmediately: boolean;

  /**
   * Whether to present analysis to dashboard.
   */
  readonly presentToDashboard: boolean;
}

/**
 * Default Coordinator configuration.
 */
export const DEFAULT_COORDINATOR_CONFIG: CoordinatorConfig = {
  executionRules: createExecutionRules({
    retryable: true,
    maxRetries: 1,
    skippable: false,
    blocking: true,
    terminal: true,
    mustExecuteAfter: ["planner", "requirements", "architect", "cost", "policy"],
    timeoutMs: 30000,
  }),
  minConfidenceThreshold: 0.6,
  decisionFactors: {
    cost: 0.25,
    performance: 0.15,
    reliability: 0.20,
    scalability: 0.15,
    policyCompliance: 0.15,
    operationalComplexity: 0.10,
  },
  generateTerraformImmediately: true,
  presentToDashboard: true,
};
