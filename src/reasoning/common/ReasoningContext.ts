/**
 * Context provided to reasoning behaviors.
 */

import type { AgentState } from "../../schemas/state";
import type { StageName } from "../../types";

/**
 * Metadata about the current stage execution.
 */
export interface StageMetadata {
  /**
   * Current stage name.
   */
  readonly stage: StageName;

  /**
   * When this stage started.
   */
  readonly startedAt: string;

  /**
   * Execution attempt number (for retries).
   */
  readonly attemptNumber: number;

  /**
   * Custom metadata.
   */
  readonly custom?: Record<string, unknown>;
}

/**
 * Context provided to each reasoning behavior.
 */
export interface ReasoningContext {
  /**
   * Current agent state.
   */
  readonly state: AgentState;

  /**
   * Stage-specific metadata.
   */
  readonly stageMetadata: StageMetadata;

  /**
   * Configuration for this stage.
   */
  readonly config: Record<string, unknown>;

  /**
   * Results of input validation.
   */
  readonly validationResult?: {
    readonly valid: boolean;
    readonly errors: readonly string[];
  };
}
