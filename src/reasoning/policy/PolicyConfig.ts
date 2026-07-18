/**
 * Policy Validator stage configuration.
 */

import type { ExecutionRules } from "../common/ExecutionRules";
import { createExecutionRules } from "../common/ExecutionRules";

/**
 * Policy stage configuration.
 */
export interface PolicyConfig {
  /**
   * Execution rules.
   */
  readonly executionRules: ExecutionRules;

  /**
   * Path to policy file.
   */
  readonly policyFilePath: string;

  /**
   * Whether to fail if policy file is missing.
   */
  readonly failOnMissingPolicyFile: boolean;

  /**
   * Whether to block workflow if all candidates fail critical policies.
   */
  readonly blockOnCriticalFailures: boolean;
}

/**
 * Default Policy configuration.
 */
export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  executionRules: createExecutionRules({
    retryable: true,
    maxRetries: 1,
    skippable: false,
    blocking: true,
    terminal: false,
    mustExecuteAfter: ["planner", "requirements", "architect", "cost"],
    timeoutMs: 15000,
  }),
  policyFilePath: "./policy.yaml",
  failOnMissingPolicyFile: false,
  blockOnCriticalFailures: false,
};
