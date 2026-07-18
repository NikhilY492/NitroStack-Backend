/**
 * Architecture Designer stage configuration.
 */

import type { ExecutionRules } from "../common/ExecutionRules";
import { createExecutionRules } from "../common/ExecutionRules";

/**
 * Architecture stage configuration.
 */
export interface ArchitectureConfig {
  /**
   * Execution rules.
   */
  readonly executionRules: ExecutionRules;

  /**
   * Number of candidates to generate.
   */
  readonly candidateCount: number;

  /**
   * Whether to read existing infrastructure.
   */
  readonly checkExistingInfra: boolean;

  /**
   * MVP catalog constraints (Section 9).
   */
  readonly mvpCatalog: {
    readonly computeTypes: readonly string[];
    readonly databaseTypes: readonly string[];
    readonly instanceTypes: readonly string[];
  };

  /**
   * Whether candidates must be meaningfully distinct.
   */
  readonly requireDistinctCandidates: boolean;
}

/**
 * Default Architecture configuration.
 */
export const DEFAULT_ARCHITECTURE_CONFIG: ArchitectureConfig = {
  executionRules: createExecutionRules({
    retryable: true,
    maxRetries: 2,
    skippable: false,
    blocking: true,
    terminal: false,
    mustExecuteAfter: ["planner", "requirements"],
    timeoutMs: 20000,
  }),
  candidateCount: 3,
  checkExistingInfra: true,
  mvpCatalog: {
    computeTypes: ["ec2", "ecs_fargate", "lambda"],
    databaseTypes: ["postgresql", "dynamodb"],
    instanceTypes: ["t3.medium", "t3.large", "t4g.medium", "m5.large"],
  },
  requireDistinctCandidates: true,
};
