/**
 * Stage-related types for the Agent Runtime.
 * 
 * These types define the contract for each reasoning stage without
 * implementing any runtime behavior.
 */

/**
 * Names of the six logical reasoning stages.
 */
export type StageName =
  | "planner"
  | "requirements"
  | "architect"
  | "cost"
  | "policy"
  | "coordinator";

/**
 * Status of a reasoning stage.
 */
export type StageStatus =
  | "pending"      // Stage has not started
  | "in_progress"  // Stage is currently executing
  | "completed"    // Stage finished successfully
  | "failed"       // Stage encountered an error
  | "skipped";     // Stage was skipped (e.g., Planner determined it wasn't needed)

/**
 * Result from executing a reasoning stage.
 * Generic over the stage's output type.
 */
export interface StageResult<T = unknown> {
  /**
   * Name of the stage that produced this result.
   */
  readonly stage: StageName;

  /**
   * Status after execution.
   */
  readonly status: StageStatus;

  /**
   * The output data from this stage (if successful).
   */
  readonly output?: T;

  /**
   * Error information (if failed).
   */
  readonly error?: StageError;

  /**
   * Timestamp when the stage started.
   */
  readonly startedAt: string;

  /**
   * Timestamp when the stage completed (or failed).
   */
  readonly completedAt?: string;

  /**
   * Duration in milliseconds (if completed).
   */
  readonly durationMs?: number;

  /**
   * Extensible metadata about stage execution.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Error information for a failed stage.
 */
export interface StageError {
  /**
   * Error code or type.
   */
  readonly code: string;

  /**
   * Human-readable error message.
   */
  readonly message: string;

  /**
   * Whether this error is recoverable.
   */
  readonly recoverable: boolean;

  /**
   * Optional details for debugging.
   */
  readonly details?: unknown;

  /**
   * Optional suggestion for how to recover.
   */
  readonly recoverySuggestion?: string;
}

/**
 * Execution record for a stage.
 * Tracks when a stage ran and what it produced.
 */
export interface StageExecution {
  /**
   * Stage name.
   */
  readonly stage: StageName;

  /**
   * When execution started.
   */
  readonly startedAt: string;

  /**
   * When execution completed.
   */
  readonly completedAt?: string;

  /**
   * Final status.
   */
  readonly status: StageStatus;

  /**
   * Number of tool calls made during this stage.
   */
  readonly toolCallsCount?: number;

  /**
   * Tool names that were called.
   */
  readonly toolsCalled?: readonly string[];
}

/**
 * Configuration for a reasoning stage.
 * Defines what the stage is allowed to do.
 */
export interface StageConfig {
  /**
   * Stage name.
   */
  readonly stage: StageName;

  /**
   * Whether this stage is enabled.
   */
  readonly enabled: boolean;

  /**
   * Tools this stage is permitted to call.
   */
  readonly allowedTools: readonly string[];

  /**
   * Timeout for stage execution (ms).
   */
  readonly timeoutMs?: number;

  /**
   * Maximum number of retries on failure.
   */
  readonly maxRetries?: number;
}
