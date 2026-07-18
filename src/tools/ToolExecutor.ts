/**
 * Orchestrates execution of multiple actions.
 * Handles sequential execution and result collection.
 */

import type { Action, ActionResult } from "../decision/Action";
import type { ExecutionPlan, PlannedAction } from "../decision/ExecutionPlan";
import {
  updatePlannedActionStatus,
  getNextExecutableAction,
  isPlanComplete,
} from "../decision/ExecutionPlan";
import type { ToolContext } from "./ToolContext";
import { ToolInvoker } from "./ToolInvoker";

/**
 * Execution result for a single plan execution.
 */
export interface ExecutionResult {
  /** The plan that was executed */
  plan: ExecutionPlan;

  /** Results for each action */
  results: Map<string, ActionResult>;

  /** Whether execution succeeded (no failures) */
  success: boolean;

  /** Number of actions executed successfully */
  completedCount: number;

  /** Number of actions that failed */
  failedCount: number;

  /** Total execution time in milliseconds */
  totalTimeMs: number;
}

/**
 * Orchestrates execution of action plans.
 */
export class ToolExecutor {
  private readonly invoker: ToolInvoker;

  /**
   * Create a tool executor.
   *
   * @param invoker Tool invoker for actual execution
   */
  constructor(invoker: ToolInvoker) {
    this.invoker = invoker;
  }

  /**
   * Execute a plan sequentially.
   *
   * @param plan Execution plan
   * @param contextFactory Factory to create tool contexts
   * @returns Execution result
   */
  public async execute(
    plan: ExecutionPlan,
    contextFactory: (action: Action, plannedAction: PlannedAction) => ToolContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results = new Map<string, ActionResult>();
    let currentPlan = plan;

    // Execute actions sequentially
    while (!isPlanComplete(currentPlan)) {
      // Get next executable action
      const nextAction = getNextExecutableAction(currentPlan);

      if (!nextAction) {
        // No executable actions and plan not complete = circular dependency or missing dependency
        break;
      }

      const action = nextAction.action;

      try {
        // Update plan: mark action as running
        currentPlan = updatePlannedActionStatus(currentPlan, action.id, "running");

        // Create context for this action
        const context = contextFactory(action, nextAction);

        // Invoke the tool
        const result = await this.invoker.invoke(action, context);

        // Store result
        results.set(action.id, result);

        // Update plan: mark action as completed or failed
        const status = result.success ? "completed" : "failed";
        currentPlan = updatePlannedActionStatus(currentPlan, action.id, status, result);

        // If execution failed and we should stop on first failure
        if (!result.success) {
          context.logger.error(`[${action.name}] Failed: ${result.error}`, {
            actionId: action.id,
          });
          // Continue to attempt other non-dependent actions
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        const failedResult: ActionResult = {
          action,
          success: false,
          data: null,
          error: `Unexpected error: ${errorMessage}`,
          executionTimeMs: Date.now() - startTime,
          attemptNumber: 0,
        };

        results.set(action.id, failedResult);
        currentPlan = updatePlannedActionStatus(
          currentPlan,
          action.id,
          "failed",
          failedResult
        );
      }
    }

    const totalTimeMs = Date.now() - startTime;
    const completedCount = currentPlan.completedCount;
    const failedCount = currentPlan.failedCount;

    return {
      plan: currentPlan,
      results,
      success: failedCount === 0,
      completedCount,
      failedCount,
      totalTimeMs,
    };
  }

  /**
   * Execute a single action (convenience method).
   *
   * @param action Action to execute
   * @param context Tool context
   * @returns Action result
   */
  public async executeAction(
    action: Action,
    context: ToolContext
  ): Promise<ActionResult> {
    return this.invoker.invoke(action, context);
  }
}
