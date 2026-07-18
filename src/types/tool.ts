/**
 * Tool-related types for MCP tool contracts.
 * 
 * These types define generic, reusable contracts for all MCP tools
 * without implementing any specific tool logic.
 */

/**
 * Base request structure for any MCP tool call.
 */
export interface ToolRequest<T = unknown> {
  /**
   * Name of the tool being called.
   */
  readonly tool: string;

  /**
   * Tool-specific parameters.
   */
  readonly parameters: T;

  /**
   * Optional request ID for tracking.
   */
  readonly requestId?: string;

  /**
   * Optional metadata.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Base response structure for any MCP tool call.
 */
export interface ToolResponse<T = unknown> {
  /**
   * Name of the tool that was called.
   */
  readonly tool: string;

  /**
   * Tool-specific result data.
   */
  readonly data: T;

  /**
   * Status of the tool execution.
   */
  readonly status: ToolStatus;

  /**
   * Request ID (if provided in request).
   */
  readonly requestId?: string;

  /**
   * Optional metadata about execution.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Status of a tool execution.
 */
export type ToolStatus = "success" | "error" | "timeout" | "not_found";

/**
 * Result wrapper for tool calls that may succeed or fail.
 * Discriminated union type for type-safe error handling.
 */
export type ToolResult<T> = ToolSuccess<T> | ToolFailure;

/**
 * Successful tool execution result.
 */
export interface ToolSuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly executionTimeMs?: number;
}

/**
 * Failed tool execution result.
 */
export interface ToolFailure {
  readonly success: false;
  readonly error: ToolError;
  readonly executionTimeMs?: number;
}

/**
 * Detailed error information from a tool call.
 */
export interface ToolError {
  /**
   * Error code (e.g., "DIR_NOT_FOUND", "POLICY_FILE_MISSING").
   */
  readonly code: string;

  /**
   * Human-readable error message.
   */
  readonly message: string;

  /**
   * Whether this error is retryable.
   */
  readonly retryable: boolean;

  /**
   * Optional details for debugging.
   */
  readonly details?: unknown;

  /**
   * Optional suggestion for how to handle the error.
   */
  readonly suggestion?: string;
}

/**
 * Record of a tool call in the agent state.
 * Tracks what tools were called, when, and with what result.
 */
export interface ToolCallRecord {
  /**
   * Tool name.
   */
  readonly tool: string;

  /**
   * When the tool was called.
   */
  readonly calledAt: string;

  /**
   * Stage that called this tool.
   */
  readonly calledBy: string;

  /**
   * Whether the call succeeded.
   */
  readonly success: boolean;

  /**
   * Execution time in milliseconds.
   */
  readonly executionTimeMs?: number;

  /**
   * Error code if failed.
   */
  readonly errorCode?: string;

  /**
   * Abbreviated parameters (for debugging, not full data).
   */
  readonly parametersSnapshot?: Record<string, unknown>;
}

/**
 * Configuration for tool execution behavior.
 */
export interface ToolExecutionConfig {
  /**
   * Tool name.
   */
  readonly tool: string;

  /**
   * Timeout for tool execution (ms).
   */
  readonly timeoutMs: number;

  /**
   * Maximum number of retries on retryable errors.
   */
  readonly maxRetries: number;

  /**
   * Backoff strategy for retries.
   */
  readonly retryBackoff?: "linear" | "exponential";

  /**
   * Whether to cache tool results.
   */
  readonly cacheable?: boolean;
}
