/**
 * Generic action model for LLM-requested operations.
 */

/**
 * Retry policy for action execution.
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
}

/**
 * Represents an action requested by the LLM.
 * Actions describe WHAT the runtime should do, not HOW.
 */
export interface Action {
  /** Unique identifier for this action */
  id: string;

  /** Name of the action (e.g., "read_policies", "estimate_resources") */
  name: string;

  /** Human-readable purpose of the action */
  purpose: string;

  /** Execution priority (1=highest, 10=lowest) */
  priority: number;

  /** Tool-specific arguments */
  arguments: Record<string, unknown>;

  /** Description of expected result */
  expectedResult: string;

  /** Array of action IDs this action depends on */
  dependencies: string[];

  /** Execution timeout in milliseconds */
  timeoutMs: number;

  /** Retry policy if action fails */
  retryPolicy: RetryPolicy;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Execution result of a single action.
 */
export interface ActionResult {
  /** The action that was executed */
  action: Action;

  /** Whether execution succeeded */
  success: boolean;

  /** Returned data (tool-specific) */
  data: Record<string, unknown> | null;

  /** Error message if failed */
  error: string | null;

  /** Execution time in milliseconds */
  executionTimeMs: number;

  /** Retry attempt number (0 = first attempt) */
  attemptNumber: number;

  /** Raw metadata from tool execution */
  metadata?: Record<string, unknown>;
}

/**
 * Creates a default retry policy.
 */
export function createDefaultRetryPolicy(): RetryPolicy {
  return {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  };
}

/**
 * Creates a new action.
 */
export function createAction(options: {
  id: string;
  name: string;
  purpose: string;
  priority?: number;
  arguments?: Record<string, unknown>;
  expectedResult?: string;
  dependencies?: string[];
  timeoutMs?: number;
  retryPolicy?: Partial<RetryPolicy>;
  metadata?: Record<string, unknown>;
}): Action {
  return {
    id: options.id,
    name: options.name,
    purpose: options.purpose,
    priority: options.priority ?? 5,
    arguments: options.arguments ?? {},
    expectedResult: options.expectedResult ?? "",
    dependencies: options.dependencies ?? [],
    timeoutMs: options.timeoutMs ?? 30000,
    retryPolicy: {
      maxAttempts: options.retryPolicy?.maxAttempts ?? 3,
      backoffMs: options.retryPolicy?.backoffMs ?? 1000,
      backoffMultiplier: options.retryPolicy?.backoffMultiplier ?? 2,
    },
    metadata: options.metadata,
  };
}

/**
 * Creates a new action result.
 */
export function createActionResult(options: {
  action: Action;
  success: boolean;
  data?: Record<string, unknown> | null;
  error?: string | null;
  executionTimeMs?: number;
  attemptNumber?: number;
  metadata?: Record<string, unknown>;
}): ActionResult {
  return {
    action: options.action,
    success: options.success,
    data: options.data ?? null,
    error: options.error ?? null,
    executionTimeMs: options.executionTimeMs ?? 0,
    attemptNumber: options.attemptNumber ?? 0,
    metadata: options.metadata,
  };
}
