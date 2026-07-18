/**
 * Planner stage configuration.
 */

import type { ExecutionRules } from "../common/ExecutionRules";
import { createExecutionRules } from "../common/ExecutionRules";

/**
 * Planner stage configuration.
 */
export interface PlannerConfig {
  /**
   * Execution rules for the Planner stage.
   */
  readonly executionRules: ExecutionRules;

  /**
   * Minimum confidence threshold to proceed (0-1).
   */
  readonly minConfidenceThreshold: number;

  /**
   * Whether to allow proceeding with partial information.
   */
  readonly allowPartialInformation: boolean;

  /**
   * Maximum length of prompt to process (characters).
   */
  readonly maxPromptLength: number;
}

/**
 * Default Planner configuration.
 */
export const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
  executionRules: createExecutionRules({
    retryable: true,
    maxRetries: 2,
    skippable: false,
    blocking: true,
    terminal: false,
    mustExecuteAfter: [],
    timeoutMs: 10000,
  }),
  minConfidenceThreshold: 0.7,
  allowPartialInformation: false,
  maxPromptLength: 5000,
};
