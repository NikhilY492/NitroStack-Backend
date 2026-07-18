/**
 * Validation rules and results.
 */

import type { AgentState } from "../../../schemas/state";

/**
 * Validation rule.
 */
export interface ValidationRule {
  /**
   * Rule identifier.
   */
  readonly id: string;

  /**
   * Human-readable description.
   */
  readonly description: string;

  /**
   * Whether this rule is required for execution.
   */
  readonly required: boolean;

  /**
   * Validates the state.
   */
  readonly validate: (state: AgentState) => boolean;

  /**
   * Error message if validation fails.
   */
  readonly errorMessage: string;
}

/**
 * Result of validating multiple rules.
 */
export interface ValidationResult {
  /**
   * Whether all required rules passed.
   */
  readonly valid: boolean;

  /**
   * Failed rules.
   */
  readonly failures: readonly {
    readonly ruleId: string;
    readonly message: string;
  }[];

  /**
   * Passed rules.
   */
  readonly passed: readonly string[];

  /**
   * Total rules evaluated.
   */
  readonly totalRules: number;
}

/**
 * Validates state against a set of rules.
 */
export function validateState(
  state: AgentState,
  rules: readonly ValidationRule[]
): ValidationResult {
  const failures: Array<{ ruleId: string; message: string }> = [];
  const passed: string[] = [];

  for (const rule of rules) {
    const isValid = rule.validate(state);
    
    if (isValid) {
      passed.push(rule.id);
    } else if (rule.required) {
      failures.push({
        ruleId: rule.id,
        message: rule.errorMessage,
      });
    }
  }

  return {
    valid: failures.length === 0,
    failures,
    passed,
    totalRules: rules.length,
  };
}
