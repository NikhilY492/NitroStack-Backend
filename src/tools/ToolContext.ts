/**
 * Context provided to tools during execution.
 */

import type { AgentState } from "../../schemas/state";
import type { Action } from "../decision/Action";

/**
 * Logging interface for tools.
 */
export interface ToolLogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Metrics collection interface.
 */
export interface ToolMetrics {
  recordExecutionTime(toolName: string, timeMs: number): void;
  recordFailure(toolName: string, error: string): void;
  recordSuccess(toolName: string): void;
}

/**
 * Context passed to every tool during execution.
 * Provides access to state, logging, and metrics without tight coupling.
 */
export interface ToolContext {
  /** The action being executed */
  action: Action;

  /** Current agent state (read-only within tool) */
  state: AgentState;

  /** Logger for debugging */
  logger: ToolLogger;

  /** Metrics collection */
  metrics: ToolMetrics;

  /** User-provided metadata */
  metadata?: Record<string, unknown>;
}

/**
 * No-op logger implementation.
 */
export class NoOpLogger implements ToolLogger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * No-op metrics implementation.
 */
export class NoOpMetrics implements ToolMetrics {
  recordExecutionTime(): void {}
  recordFailure(): void {}
  recordSuccess(): void {}
}

/**
 * Creates a tool context.
 */
export function createToolContext(
  action: Action,
  state: AgentState,
  options?: {
    logger?: ToolLogger;
    metrics?: ToolMetrics;
    metadata?: Record<string, unknown>;
  }
): ToolContext {
  return {
    action,
    state,
    logger: options?.logger ?? new NoOpLogger(),
    metrics: options?.metrics ?? new NoOpMetrics(),
    metadata: options?.metadata,
  };
}
