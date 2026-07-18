/**
 * Maps raw tool results into shared Phase 1 ToolResult types.
 * Ensures type safety across tool boundaries.
 */

import type { ActionResult } from "../decision/Action";

/**
 * Maps an action result to a shared ToolResult type.
 */
export class ToolResultMapper {
  /**
   * Map action result to a typed ToolResult.
   *
   * @param result Action result from tool execution
   * @param expectedType Expected type for validation
   * @returns Mapped ToolResult
   */
  public static mapResult<T>(
    result: ActionResult,
    expectedType?: string
  ): ToolResult<T> {
    if (!result.success) {
      return {
        success: false,
        data: null as unknown as T,
        error: {
          code: "TOOL_ERROR",
          message: result.error ?? "Unknown error",
          retryable: this.isRetryable(result),
        },
        metadata: {
          actionId: result.action.id,
          actionName: result.action.name,
          executionTimeMs: result.executionTimeMs,
          attemptNumber: result.attemptNumber,
        },
      };
    }

    // Validate result data if type is specified
    if (expectedType && !this.validateType(result.data, expectedType)) {
      return {
        success: false,
        data: null as unknown as T,
        error: {
          code: "INVALID_RESPONSE",
          message: `Tool response does not match expected type: ${expectedType}`,
          retryable: false,
        },
        metadata: {
          actionId: result.action.id,
          actionName: result.action.name,
          executionTimeMs: result.executionTimeMs,
          attemptNumber: result.attemptNumber,
        },
      };
    }

    return {
      success: true,
      data: result.data as T,
      error: null,
      metadata: {
        actionId: result.action.id,
        actionName: result.action.name,
        executionTimeMs: result.executionTimeMs,
        attemptNumber: result.attemptNumber,
      },
    };
  }

  /**
   * Determine if an error is retryable.
   */
  private static isRetryable(result: ActionResult): boolean {
    if (!result.error) return false;

    const retryableErrors = [
      "TIMEOUT",
      "RATE_LIMITED",
      "SERVICE_UNAVAILABLE",
      "TEMPORARY_ERROR",
    ];

    return retryableErrors.some((err) => result.error?.includes(err));
  }

  /**
   * Validate that result data matches expected type.
   * Simple type checking.
   */
  private static validateType(
    data: unknown,
    expectedType: string
  ): boolean {
    if (data === null || data === undefined) {
      return false;
    }

    switch (expectedType.toLowerCase()) {
      case "array":
        return Array.isArray(data);
      case "object":
        return typeof data === "object" && !Array.isArray(data);
      case "string":
        return typeof data === "string";
      case "number":
        return typeof data === "number";
      case "boolean":
        return typeof data === "boolean";
      default:
        return true; // Accept unknown types
    }
  }
}

/**
 * Shared ToolResult type (from Phase 1).
 * All tool results are mapped to this type.
 */
export interface ToolResult<T> {
  /** Whether tool execution succeeded */
  success: boolean;

  /** Result data if successful */
  data: T;

  /** Error details if failed */
  error: {
    code: string;
    message: string;
    retryable: boolean;
  } | null;

  /** Execution metadata */
  metadata: {
    actionId: string;
    actionName: string;
    executionTimeMs: number;
    attemptNumber: number;
  };
}

/**
 * Batch result mapper for multiple results.
 */
export class BatchResultMapper {
  /**
   * Map multiple results.
   *
   * @param results Array of action results
   * @returns Array of mapped tool results
   */
  public static mapResults<T>(results: ActionResult[]): ToolResult<T>[] {
    return results.map((result) => ToolResultMapper.mapResult<T>(result));
  }

  /**
   * Aggregate multiple results into a single combined result.
   *
   * @param results Array of action results
   * @returns Combined result
   */
  public static aggregateResults(
    results: ActionResult[]
  ): {
    success: boolean;
    totalCompleted: number;
    totalFailed: number;
    results: ToolResult<Record<string, unknown>>[];
  } {
    const completed = results.filter((r) => r.success).length;
    const failed = results.length - completed;

    return {
      success: failed === 0,
      totalCompleted: completed,
      totalFailed: failed,
      results: BatchResultMapper.mapResults(results),
    };
  }
}
