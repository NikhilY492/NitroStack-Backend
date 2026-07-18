/**
 * Execution plan representing an ordered sequence of actions.
 */

import type { Action, ActionResult } from "./Action";

/**
 * Status of an action in the execution plan.
 */
export type ActionStatus = "pending" | "running" | "completed" | "failed" | "skipped";

/**
 * Represents an action in an execution plan with its status.
 */
export interface PlannedAction {
  /** The action to execute */
  action: Action;

  /** Current execution status */
  status: ActionStatus;

  /** Result if completed or failed */
  result?: ActionResult;

  /** Time action was added to plan */
  createdAt: Date;

  /** Time execution started */
  startedAt?: Date;

  /** Time execution completed */
  completedAt?: Date;
}

/**
 * Represents an ordered sequence of actions to execute.
 */
export interface ExecutionPlan {
  /** Unique identifier for this plan */
  id: string;

  /** Human-readable description of the plan */
  description: string;

  /** Ordered list of planned actions */
  actions: PlannedAction[];

  /** Overall plan status */
  status: "pending" | "running" | "completed" | "failed";

  /** Number of actions completed successfully */
  completedCount: number;

  /** Number of actions that failed */
  failedCount: number;

  /** Time plan was created */
  createdAt: Date;

  /** Time execution started */
  startedAt?: Date;

  /** Time execution completed */
  completedAt?: Date;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Creates a new execution plan.
 */
export function createExecutionPlan(options: {
  id: string;
  description?: string;
  actions: Action[];
  metadata?: Record<string, unknown>;
}): ExecutionPlan {
  const now = new Date();

  return {
    id: options.id,
    description: options.description ?? "Execution plan",
    actions: options.actions.map((action) => ({
      action,
      status: "pending" as const,
      createdAt: now,
    })),
    status: "pending" as const,
    completedCount: 0,
    failedCount: 0,
    createdAt: now,
    metadata: options.metadata,
  };
}

/**
 * Updates the status of an action in the execution plan.
 */
export function updatePlannedActionStatus(
  plan: ExecutionPlan,
  actionId: string,
  status: ActionStatus,
  result?: ActionResult
): ExecutionPlan {
  const updated = { ...plan };
  const plannedAction = updated.actions.find((pa) => pa.action.id === actionId);

  if (!plannedAction) {
    return plan;
  }

  plannedAction.status = status;
  if (result) {
    plannedAction.result = result;
  }

  if (status === "running" && !plannedAction.startedAt) {
    plannedAction.startedAt = new Date();
  }

  if (status === "completed" || status === "failed") {
    plannedAction.completedAt = new Date();
  }

  // Update plan-level counts
  updated.completedCount = updated.actions.filter(
    (pa) => pa.status === "completed"
  ).length;
  updated.failedCount = updated.actions.filter(
    (pa) => pa.status === "failed"
  ).length;

  // Update plan status
  const allCompleted = updated.actions.every(
    (pa) => pa.status === "completed" || pa.status === "skipped"
  );
  const anyFailed = updated.actions.some((pa) => pa.status === "failed");

  if (anyFailed) {
    updated.status = "failed";
  } else if (allCompleted) {
    updated.status = "completed";
  } else if (updated.actions.some((pa) => pa.status === "running")) {
    updated.status = "running";
  }

  return updated;
}

/**
 * Gets the next pending action that has all dependencies completed.
 */
export function getNextExecutableAction(
  plan: ExecutionPlan
): PlannedAction | null {
  return (
    plan.actions.find((plannedAction) => {
      // Must be pending
      if (plannedAction.status !== "pending") {
        return false;
      }

      // All dependencies must be completed
      const allDependenciesComplete = plannedAction.action.dependencies.every(
        (depId) => {
          const depAction = plan.actions.find((pa) => pa.action.id === depId);
          return depAction && depAction.status === "completed";
        }
      );

      return allDependenciesComplete;
    }) ?? null
  );
}

/**
 * Checks if a plan is complete (all actions executed).
 */
export function isPlanComplete(plan: ExecutionPlan): boolean {
  return plan.actions.every(
    (pa) => pa.status === "completed" || pa.status === "skipped"
  );
}

/**
 * Checks if a plan has failed.
 */
export function isPlanFailed(plan: ExecutionPlan): boolean {
  return plan.actions.some((pa) => pa.status === "failed");
}
