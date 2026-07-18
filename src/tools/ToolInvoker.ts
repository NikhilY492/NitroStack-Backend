/**
 * Invokes tools and captures execution metadata.
 * Single responsibility: execute tools and handle errors.
 */

import type { Action, ActionResult } from "../decision/Action";
import { createActionResult } from "../decision/Action";
import type { Tool } from "./Tool";
import type { ToolContext } from "./ToolContext";
import { ToolRouter } from "./ToolRouter";

/**
 * Tool invocation metadata.
 */
export interface InvocationMetadata {
  toolName: string;
  actionId: string;
  attemptNumber: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

/**
 * Tool invocation error details.
 */
export interface InvocationError {
  code: "TOOL_NOT_FOUND" | "VALIDATION_ERROR" | "EXECUTION_ERROR" | "TIMEOUT" | "RETRY_EXHAUSTED";
  message: string;
  originalError?: Error;
}

/**
 * Invokes tools with execution tracking.
 */
export class ToolInvoker {
  private readonly router: ToolRouter;

  /**
   * Create a tool invoker.
   *
   * @param router Tool router for action->tool mapping
   */
  constructor(router: ToolRouter) {
    this.router = router;
  }

  /**
   * Invoke a tool for an action with retry logic.
   *
   * @param action Action to invoke
   * @param context Tool context (state, logger, etc.)
   * @returns Action result
   */
  public async invoke(action: Action, context: ToolContext): Promise<ActionResult> {
    const startTime = Date.now();
    let lastError: InvocationError | null = null;
    let attemptNumber = 0;

    // Retry loop
    for (attemptNumber = 0; attemptNumber < action.retryPolicy.maxAttempts; attemptNumber++) {
      try {
        // Route action to tool
        const routingResult = this.router.route(action);

        if (!routingResult.success) {
          lastError = {
            code: "TOOL_NOT_FOUND",
            message: routingResult.error ?? "Unknown routing error",
          };
          break; // Don't retry routing errors
        }

        const tool = routingResult.tool!;

        context.logger.info(`[${action.name}] Attempt ${attemptNumber + 1}/${action.retryPolicy.maxAttempts}`, {
          toolName: tool.name,
          actionId: action.id,
        });

        // Execute tool
        const result = await this.executeWithTimeout(tool, action.arguments, action.timeoutMs);

        const executionTimeMs = Date.now() - startTime;

        context.metrics.recordSuccess(tool.name);

        return createActionResult({
          action,
          success: true,
          data: result,
          executionTimeMs,
          attemptNumber,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        lastError = {
          code: "EXECUTION_ERROR",
          message: err.message,
          originalError: err,
        };

        context.logger.warn(`[${action.name}] Execution failed on attempt ${attemptNumber + 1}`, {
          error: err.message,
        });

        // Apply backoff before retry
        if (attemptNumber < action.retryPolicy.maxAttempts - 1) {
          const backoffMs =
            action.retryPolicy.backoffMs *
            Math.pow(action.retryPolicy.backoffMultiplier, attemptNumber);

          context.logger.debug(`[${action.name}] Waiting ${backoffMs}ms before retry`);
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries exhausted
    const executionTimeMs = Date.now() - startTime;

    if (lastError) {
      context.metrics.recordFailure(action.name, lastError.message);

      return createActionResult({
        action,
        success: false,
        error: `${lastError.code}: ${lastError.message}`,
        executionTimeMs,
        attemptNumber,
      });
    }

    return createActionResult({
      action,
      success: false,
      error: "Unknown error",
      executionTimeMs,
      attemptNumber,
    });
  }

  /**
   * Execute a tool with timeout protection.
   *
   * @param tool Tool to execute
   * @param args Arguments to pass
   * @param timeoutMs Timeout in milliseconds
   * @returns Tool result
   */
  private executeWithTimeout(
    tool: Tool,
    args: Record<string, unknown>,
    timeoutMs: number
  ): Promise<Record<string, unknown>> {
    return Promise.race([
      tool.execute(args),
      new Promise<Record<string, unknown>>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool execution timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Sleep for a duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
