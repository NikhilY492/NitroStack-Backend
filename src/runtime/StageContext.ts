/**
 * Context passed to each stage during execution.
 * Contains the current state and runtime configuration.
 */

import type { AgentState } from "../schemas/state";

/**
 * Runtime configuration options.
 */
export interface RuntimeConfig {
  /**
   * Maximum execution time per stage (ms).
   */
  readonly stageTimeoutMs?: number;

  /**
   * Whether to enable verbose logging.
   */
  readonly verbose?: boolean;

  /**
   * Custom execution metadata.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Execution metadata tracked during runtime.
 */
export interface ExecutionMetadata {
  /**
   * When execution started.
   */
  readonly startedAt: string;

  /**
   * Total stages executed so far.
   */
  readonly stagesExecuted: number;

  /**
   * Custom tracking data.
   */
  readonly custom?: Record<string, unknown>;
}

/**
 * Context provided to each stage during execution.
 */
export interface StageContext {
  /**
   * Current agent state.
   */
  readonly state: AgentState;

  /**
   * Runtime configuration.
   */
  readonly config: RuntimeConfig;

  /**
   * Execution metadata.
   */
  readonly metadata: ExecutionMetadata;
}
