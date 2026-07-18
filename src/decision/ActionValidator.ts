/**
 * Validates actions before execution.
 */

import type { Action } from "./Action";

/**
 * Validation error for an action.
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;

  /** Error message */
  message: string;

  /** Severity level */
  severity: "error" | "warning";
}

/**
 * Result of action validation.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Validation errors if any */
  errors: ValidationError[];

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Validates actions for execution.
 */
export class ActionValidator {
  /**
   * Validates a single action.
   */
  public static validate(action: Action): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!action.id || action.id.trim() === "") {
      errors.push({
        field: "id",
        message: "Action ID is required",
        severity: "error",
      });
    }

    if (!action.name || action.name.trim() === "") {
      errors.push({
        field: "name",
        message: "Action name is required",
        severity: "error",
      });
    }

    if (!action.purpose || action.purpose.trim() === "") {
      errors.push({
        field: "purpose",
        message: "Action purpose is required",
        severity: "warning",
      });
    }

    // Validate priority
    if (action.priority < 1 || action.priority > 10) {
      errors.push({
        field: "priority",
        message: "Priority must be between 1 and 10",
        severity: "error",
      });
    }

    // Validate arguments
    if (typeof action.arguments !== "object" || action.arguments === null) {
      errors.push({
        field: "arguments",
        message: "Arguments must be an object",
        severity: "error",
      });
    }

    // Validate timeout
    if (action.timeoutMs < 1000 || action.timeoutMs > 300000) {
      errors.push({
        field: "timeoutMs",
        message: "Timeout must be between 1000ms and 300000ms",
        severity: "warning",
      });
    }

    // Validate retry policy
    if (action.retryPolicy.maxAttempts < 1 || action.retryPolicy.maxAttempts > 10) {
      errors.push({
        field: "retryPolicy.maxAttempts",
        message: "Max attempts must be between 1 and 10",
        severity: "error",
      });
    }

    if (action.retryPolicy.backoffMs < 0 || action.retryPolicy.backoffMs > 60000) {
      errors.push({
        field: "retryPolicy.backoffMs",
        message: "Backoff must be between 0 and 60000ms",
        severity: "error",
      });
    }

    if (action.retryPolicy.backoffMultiplier < 1 || action.retryPolicy.backoffMultiplier > 10) {
      errors.push({
        field: "retryPolicy.backoffMultiplier",
        message: "Backoff multiplier must be between 1 and 10",
        severity: "error",
      });
    }

    // Validate dependencies
    if (!Array.isArray(action.dependencies)) {
      errors.push({
        field: "dependencies",
        message: "Dependencies must be an array",
        severity: "error",
      });
    }

    // Check for circular dependencies (simplified check)
    if (action.dependencies.includes(action.id)) {
      errors.push({
        field: "dependencies",
        message: "Action cannot depend on itself",
        severity: "error",
      });
    }

    return {
      valid: errors.filter((e) => e.severity === "error").length === 0,
      errors,
    };
  }

  /**
   * Validates a sequence of actions for consistency.
   */
  public static validateSequence(actions: Action[]): ValidationResult {
    const errors: ValidationError[] = [];
    const actionIds = new Set(actions.map((a) => a.id));

    for (const action of actions) {
      // Validate individual action
      const result = this.validate(action);
      errors.push(...result.errors);

      // Validate dependencies reference existing actions
      for (const depId of action.dependencies) {
        if (!actionIds.has(depId)) {
          errors.push({
            field: `dependencies`,
            message: `Action ${action.id} depends on non-existent action ${depId}`,
            severity: "error",
          });
        }
      }
    }

    return {
      valid: errors.filter((e) => e.severity === "error").length === 0,
      errors,
    };
  }

  /**
   * Validates action arguments against expected schema.
   */
  public static validateArguments(
    action: Action,
    requiredFields: readonly string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of requiredFields) {
      if (!(field in action.arguments)) {
        errors.push({
          field: `arguments.${field}`,
          message: `Required argument "${field}" is missing`,
          severity: "error",
        });
      }
    }

    return errors;
  }
}
