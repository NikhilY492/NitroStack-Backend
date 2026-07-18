/**
 * Generic behavior contract that every reasoning stage must implement.
 * This describes WHAT a stage does, not HOW it does it.
 */

import type { StageName } from "../../types";

/**
 * Describes the dependencies of a stage.
 */
export interface StageDependencies {
  /**
   * Stages that must complete before this stage can execute.
   */
  readonly requiredStages: readonly StageName[];

  /**
   * Stages that should complete but are not strictly required.
   */
  readonly optionalStages?: readonly StageName[];

  /**
   * Required state fields that must exist before execution.
   */
  readonly requiredStateFields: readonly string[];
}

/**
 * Describes what a stage produces.
 */
export interface StageOutputs {
  /**
   * State fields that this stage populates.
   */
  readonly stateFields: readonly string[];

  /**
   * Reasoning output type.
   */
  readonly reasoningType: string;

  /**
   * Whether this stage produces a terminal result.
   */
  readonly terminal: boolean;
}

/**
 * Generic behavior contract for a reasoning stage.
 */
export interface Behavior {
  /**
   * Stage name.
   */
  readonly stage: StageName;

  /**
   * High-level objective of this stage.
   */
  readonly objective: string;

  /**
   * Detailed responsibilities.
   */
  readonly responsibilities: readonly string[];

  /**
   * What this stage expects as input.
   */
  readonly expectedInputs: StageDependencies;

  /**
   * What this stage produces.
   */
  readonly expectedOutputs: StageOutputs;

  /**
   * Success criteria for this stage.
   */
  readonly successCriteria: readonly string[];

  /**
   * Conditions under which this stage should fail.
   */
  readonly failureConditions: readonly string[];

  /**
   * Assumptions this stage makes about the system or data.
   */
  readonly assumptions: readonly string[];

  /**
   * How this stage updates the shared AgentState.
   */
  readonly stateUpdates: readonly string[];
}
