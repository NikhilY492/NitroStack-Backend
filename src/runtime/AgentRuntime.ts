/**
 * Agent Runtime - orchestrates stage execution.
 */

import type { AgentState } from "../schemas/state";
import type { StageName, StageStatus } from "../types";
import { setCurrentStage, markStageCompleted, touchState } from "../schemas/state.schema";
import { StageRegistry } from "./StageRegistry";
import { StageFactory } from "./StageFactory";
import { DEFAULT_PIPELINE, type Pipeline } from "./Pipeline";
import type { RuntimeConfig, StageContext } from "./StageContext";

/**
 * Agent Runtime orchestrates the execution of reasoning stages.
 * 
 * Responsibilities:
 * - Execute stages in pipeline order
 * - Update agent state between stages
 * - Handle stage failures
 * - Manage execution flow
 */
export class AgentRuntime {
  private readonly registry: StageRegistry;
  private readonly pipeline: Pipeline;
  private readonly config: RuntimeConfig;

  constructor(config: RuntimeConfig = {}, pipeline: Pipeline = DEFAULT_PIPELINE) {
    this.config = { verbose: true, ...config };
    this.pipeline = pipeline;
    this.registry = new StageRegistry();

    // Register all stages
    this.initializeRegistry();
  }

  /**
   * Initializes the stage registry with all stages.
   */
  private initializeRegistry(): void {
    const stages = StageFactory.createAll();
    for (const stage of stages) {
      this.registry.register(stage);
    }
  }

  /**
   * Executes the agent workflow starting from the beginning.
   * 
   * @param initialState - Initial agent state
   * @returns Final agent state after execution
   */
  public async execute(initialState: AgentState): Promise<AgentState> {
    let state = initialState;
    let currentStageName: StageName | undefined = this.pipeline.startStage;

    const executionStartedAt = new Date().toISOString();
    let stagesExecuted = 0;

    this.log("Starting agent runtime execution...");

    while (currentStageName) {
      const stage = this.registry.get(currentStageName);

      // Update state to reflect current stage
      state = setCurrentStage(state, currentStageName);

      // Create execution context
      const context: StageContext = {
        state,
        config: this.config,
        metadata: {
          startedAt: executionStartedAt,
          stagesExecuted,
        },
      };

      // Check if stage can execute
      if (!stage.canExecute(context)) {
        this.log(`Skipping ${currentStageName} - cannot execute`);
        currentStageName = stage.getNextStage(state);
        continue;
      }

      // Execute stage
      this.log(`Executing ${currentStageName}...`);
      const result = await stage.execute(context);

      // Handle result
      state = this.handleStageResult(state, result);
      stagesExecuted++;

      // Determine next stage
      if (result.status === "completed") {
        currentStageName = stage.getNextStage(state);
        this.log(
          currentStageName
            ? `Moving to ${currentStageName}`
            : "Workflow complete"
        );
      } else if (result.status === "failed") {
        this.log(`Stage ${currentStageName} failed: ${result.error?.message}`);
        throw new Error(`Stage ${currentStageName} failed: ${result.error?.message}`);
      } else {
        // Skipped or waiting
        currentStageName = stage.getNextStage(state);
      }
    }

    this.log("Agent runtime execution complete");
    return state;
  }

  /**
   * Handles a stage result and updates state accordingly.
   */
  private handleStageResult(state: AgentState, result: ReturnType<typeof this.createStageResult>): AgentState {
    let updatedState = touchState(state);

    if (result.status === "completed") {
      // Mark stage as completed
      updatedState = markStageCompleted(updatedState, result.stage);

      // Phase 5: More sophisticated state updates happen here
      // - Update reasoning with result.output
      // - Update requirements/architecture/pricing/policy as appropriate
    }

    return updatedState;
  }

  /**
   * Helper to create a properly typed stage result.
   */
  private createStageResult(result: {
    stage: StageName;
    status: StageStatus;
    error?: { message: string };
  }) {
    return result;
  }

  /**
   * Logging helper.
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[AgentRuntime] ${message}`);
    }
  }
}
