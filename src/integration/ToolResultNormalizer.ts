/**
 * Normalizes MCP tool results to the AI Runtime ToolResult contract.
 * Handles type conversion and result mapping without modifying original MCP tools.
 */

import type { ToolResult } from "../tools/ToolResultMapper";
import type { Action, ActionResult } from "../decision/Action";

/**
 * Normalizes an MCP tool result into the ToolResult contract.
 * MCP tools return plain Record<string, unknown> objects.
 * This adapter converts them into the expected ToolResult format.
 */
export class ToolResultNormalizer {
  /**
   * Normalize a tool execution result.
   * 
   * @param action The original action that was executed
   * @param success Whether the tool call succeeded
   * @param data The raw tool result (from MCP tool or error message)
   * @param executionTimeMs Time spent executing
   * @param attemptNumber Which retry attempt this was
   * @returns ActionResult suitable for state updates
   */
  static normalizeActionResult(
    action: Action,
    success: boolean,
    data: Record<string, unknown> | string | null,
    executionTimeMs: number,
    attemptNumber: number = 0
  ): ActionResult {
    if (typeof data === "string") {
      // Error message was passed as string
      return {
        action,
        success: false,
        data: null,
        error: data,
        executionTimeMs,
        attemptNumber,
      };
    }

    if (success) {
      return {
        action,
        success: true,
        data: (data ?? {}) as Record<string, unknown>,
        error: null,
        executionTimeMs,
        attemptNumber,
      };
    }

    // Failed with data object containing error info
    const errorMessage =
      typeof data?.error === "string" ? data.error : "Tool execution failed";

    return {
      action,
      success: false,
      data: data ?? null,
      error: errorMessage,
      executionTimeMs,
      attemptNumber,
    };
  }

  /**
   * Convert an ActionResult to a ToolResult for external consumption.
   */
  static toToolResult<T = Record<string, unknown>>(
    result: ActionResult
  ): ToolResult<T> {
    if (!result.success) {
      return {
        success: false,
        data: null as unknown as T,
        error: {
          code: "TOOL_ERROR",
          message: result.error ?? "Unknown error",
          retryable: this.isRetryable(result.error),
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
      data: (result.data ?? {}) as T,
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
  private static isRetryable(error: string | null): boolean {
    if (!error) return false;

    const retryablePatterns = [
      /timeout/i,
      /rate.?limited/i,
      /unavailable/i,
      /econnrefused/i,
      /enotfound/i,
      /ECONNRESET/i,
    ];

    return retryablePatterns.some((pattern) => pattern.test(error));
  }

  /**
   * Validate that an MCP result has expected fields.
   * Returns the data if valid, throws if not.
   */
  static validateMCPResult(
    result: unknown,
    expectedFields: string[] = []
  ): Record<string, unknown> {
    if (!result || typeof result !== "object") {
      throw new Error(`Invalid MCP result: expected object, got ${typeof result}`);
    }

    const resultObj = result as Record<string, unknown>;

    for (const field of expectedFields) {
      if (!(field in resultObj)) {
        throw new Error(
          `Invalid MCP result: missing required field "${field}"`
        );
      }
    }

    return resultObj;
  }
}
