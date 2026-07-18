/**
 * Pipeline configuration for stage execution order.
 */

import type { StageName } from "../types";

/**
 * Defines the execution order of stages.
 */
export interface Pipeline {
  /**
   * Starting stage name.
   */
  readonly startStage: StageName;

  /**
   * Ordered list of all stages in the pipeline.
   */
  readonly stages: readonly StageName[];
}

/**
 * Default pipeline matching the architecture document.
 * 
 * Order:
 * 1. Planner
 * 2. Requirements Extractor
 * 3. Architecture Designer
 * 4. Cost Analyst
 * 5. Policy Validator
 * 6. Coordinator
 */
export const DEFAULT_PIPELINE: Pipeline = {
  startStage: "planner",
  stages: [
    "planner",
    "requirements",
    "architect",
    "cost",
    "policy",
    "coordinator",
  ],
};

/**
 * Creates a custom pipeline.
 * 
 * @param startStage - Starting stage
 * @param stages - Ordered stages
 * @returns Pipeline configuration
 */
export function createPipeline(startStage: StageName, stages: StageName[]): Pipeline {
  return {
    startStage,
    stages,
  };
}
