/**
 * Result of executing a behavior.
 */

/**
 * Status of behavior execution.
 */
export type BehaviorStatus = "success" | "failure" | "partial" | "skipped";

/**
 * Result of behavior execution.
 */
export interface BehaviorResult<T = unknown> {
  /**
   * Execution status.
   */
  readonly status: BehaviorStatus;

  /**
   * Produced output (if successful or partial).
   */
  readonly output?: T;

  /**
   * Validation errors (if any).
   */
  readonly errors?: readonly string[];

  /**
   * Warnings (non-blocking issues).
   */
  readonly warnings?: readonly string[];

  /**
   * Confidence score (0-1).
   */
  readonly confidence?: number;

  /**
   * Execution metadata.
   */
  readonly metadata?: Record<string, unknown>;
}
