/**
 * Execution rules for stage behavior.
 */

import type { StageName } from "../../types";

/**
 * Execution rules that govern stage behavior.
 */
export interface ExecutionRules {
  /**
   * Whether this stage can be retried on failure.
   */
  readonly retryable: boolean;

  /**
   * Maximum number of retry attempts.
   */
  readonly maxRetries?: number;

  /**
   * Whether this stage can be skipped.
   */
  readonly skippable: boolean;

  /**
   * Whether this stage blocks the workflow if it fails.
   */
  readonly blocking: boolean;

  /**
   * Whether this stage is a terminal stage (ends the workflow).
   */
  readonly terminal: boolean;

  /**
   * Timeout for stage execution (milliseconds).
   */
  readonly timeoutMs?: number;

  /**
   * Stages that must complete before this stage.
   */
  readonly mustExecuteAfter: readonly StageName[];

  /**
   * Stages that this stage should ideally execute after.
   */
  readonly shouldExecuteAfter?: readonly StageName[];
}

/**
 * Default execution rules.
 */
export const DEFAULT_EXECUTION_RULES: ExecutionRules = {
  retryable: false,
  skippable: false,
  blocking: true,
  terminal: false,
  mustExecuteAfter: [],
};

/**
 * Creates execution rules with defaults.
 */
export function createExecutionRules(
  overrides: Partial<ExecutionRules>
): ExecutionRules {
  return {
    ...DEFAULT_EXECUTION_RULES,
    ...overrides,
  };
}
