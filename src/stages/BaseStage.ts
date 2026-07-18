/**
 * Abstract base stage implementation.
 * Provides common functionality for all stages.
 */

import type { AgentState } from "../schemas/state";
import type { StageName, StageResult } from "../types";
import type { Stage } from "./Stage";
import type { StageContext } from "../runtime/StageContext";

/**
 * Tool execution dependencies (optional).
 * Stages can optionally use tools via the decision/tool pipeline.
 */
export interface StageToolDependencies {
  actionPlanner?: any; // ActionPlanner from decision layer
  toolExecutor?: any; // ToolExecutor from tools layer
}

/**
 * Abstract base class for stage implementations.
 * Provides common functionality and lifecycle hooks.
 */
export abstract class BaseStage implements Stage {
  public abstract readonly name: StageName;
  protected toolDeps?: StageToolDependencies;

  /**
   * Set tool execution dependencies.
   * Allows stages to invoke tools if needed.
   */
  public setToolDependencies(deps: StageToolDependencies): void {
    this.toolDeps = deps;
  }

  /**
   * Determines if this stage can execute.
   * Default implementation checks if stage hasn't already completed.
   */
  public canExecute(context: StageContext): boolean {
    return !context.state.completedStages.includes(this.name);
  }

  /**
   * Executes the stage with lifecycle hooks.
   */
  public async execute(context: StageContext): Promise<StageResult> {
    const startedAt = new Date().toISOString();

    try {
      this.beforeExecute(context);
      
      const output = await this.executeInternal(context);
      
      this.afterExecute(context, output);

      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - new Date(startedAt).getTime();

      return {
        stage: this.name,
        status: "completed",
        output,
        startedAt,
        completedAt,
        durationMs,
      };
    } catch (error) {
      return this.handleError(error, startedAt);
    }
  }

  /**
   * Internal execution logic - must be implemented by subclasses.
   */
  protected abstract executeInternal(context: StageContext): Promise<unknown>;

  /**
   * Determines the next stage to execute.
   */
  public abstract getNextStage(state: AgentState): StageName | undefined;

  /**
   * Lifecycle hook: called before execution.
   */
  protected beforeExecute(context: StageContext): void {
    this.log(`Executing ${this.name}...`, context);
  }

  /**
   * Lifecycle hook: called after successful execution.
   */
  protected afterExecute(context: StageContext, _output: unknown): void {
    this.log(`Completed ${this.name}`, context);
  }

  /**
   * Handles execution errors.
   */
  protected handleError(error: unknown, startedAt: string): StageResult {
    const message = error instanceof Error ? error.message : String(error);
    
    return {
      stage: this.name,
      status: "failed",
      error: {
        code: "STAGE_EXECUTION_ERROR",
        message,
        recoverable: false,
      },
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Logging helper.
   */
  protected log(message: string, context: StageContext): void {
    if (context.config.verbose) {
      console.log(`[${this.name}] ${message}`);
    }
  }

  /**
   * Validates that required state fields exist.
   */
  protected validateState(state: AgentState, requiredFields: (keyof AgentState)[]): void {
    for (const field of requiredFields) {
      if (state[field] === undefined) {
        throw new Error(`Required field '${String(field)}' is missing from state`);
      }
    }
  }
}
