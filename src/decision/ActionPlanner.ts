/**
 * Converts LLM output into an execution plan.
 */

import type { Action } from "./Action";
import type { ExecutionPlan } from "./ExecutionPlan";
import { createExecutionPlan } from "./ExecutionPlan";
import { ActionValidator } from "./ActionValidator";

/**
 * Represents LLM output with requested actions.
 */
export interface LLMActionOutput {
  /** Reasoning about why these actions are needed */
  reasoning: string;

  /** Ordered list of actions to execute */
  actions: Action[];

  /** Optional metadata about the output */
  metadata?: Record<string, unknown>;
}

/**
 * Planning result with the execution plan and any validation issues.
 */
export interface PlanningResult {
  /** Whether planning succeeded */
  success: boolean;

  /** The execution plan if planning succeeded */
  plan?: ExecutionPlan;

  /** Validation errors if planning failed */
  errors: string[];

  /** Number of actions in the plan */
  actionCount: number;

  /** Time taken to plan (ms) */
  planningTimeMs: number;
}

/**
 * Converts LLM output into an execution plan.
 */
export class ActionPlanner {
  /**
   * Creates an execution plan from LLM action output.
   */
  public static plan(
    output: LLMActionOutput,
    planId: string
  ): PlanningResult {
    const startTime = Date.now();
    const errors: string[] = [];

    // Validate that actions array exists
    if (!Array.isArray(output.actions)) {
      return {
        success: false,
        errors: ["LLM output does not contain an actions array"],
        actionCount: 0,
        planningTimeMs: Date.now() - startTime,
      };
    }

    if (output.actions.length === 0) {
      return {
        success: false,
        errors: ["No actions requested by LLM"],
        actionCount: 0,
        planningTimeMs: Date.now() - startTime,
      };
    }

    // Validate action sequence
    const sequenceValidation = ActionValidator.validateSequence(output.actions);
    if (!sequenceValidation.valid) {
      const errorMessages = sequenceValidation.errors
        .filter((e) => e.severity === "error")
        .map((e) => `${e.field}: ${e.message}`);
      errors.push(...errorMessages);
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        actionCount: output.actions.length,
        planningTimeMs: Date.now() - startTime,
      };
    }

    // Create execution plan
    const plan = createExecutionPlan({
      id: planId,
      description: output.reasoning,
      actions: output.actions,
      metadata: output.metadata,
    });

    return {
      success: true,
      plan,
      errors: [],
      actionCount: output.actions.length,
      planningTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Extracts actions from partially structured LLM output.
   * Useful if LLM output needs transformation before planning.
   */
  public static extractActions(
    rawOutput: Record<string, unknown>
  ): Action[] | null {
    // If output has 'actions' field, use it
    if (Array.isArray(rawOutput.actions)) {
      return rawOutput.actions as Action[];
    }

    // If output IS an array, return as-is
    if (Array.isArray(rawOutput)) {
      return rawOutput as Action[];
    }

    return null;
  }

  /**
   * Sorts actions by priority (lower number = higher priority).
   */
  public static sortByPriority(actions: Action[]): Action[] {
    return [...actions].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Detects if actions have circular dependencies.
   */
  public static hasCircularDependencies(actions: Action[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (actionId: string): boolean => {
      visited.add(actionId);
      recursionStack.add(actionId);

      const action = actions.find((a) => a.id === actionId);
      if (!action) return false;

      for (const depId of action.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(actionId);
      return false;
    };

    for (const action of actions) {
      if (!visited.has(action.id)) {
        if (hasCycle(action.id)) {
          return true;
        }
      }
    }

    return false;
  }
}
