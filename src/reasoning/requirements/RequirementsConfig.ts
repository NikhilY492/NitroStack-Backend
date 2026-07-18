/**
 * Requirements Extractor stage configuration.
 */

import type { ExecutionRules } from "../common/ExecutionRules";
import { createExecutionRules } from "../common/ExecutionRules";

/**
 * Requirements stage configuration.
 */
export interface RequirementsConfig {
  /**
   * Execution rules.
   */
  readonly executionRules: ExecutionRules;

  /**
   * Whether to call estimate_resource_requirements tool.
   */
  readonly estimateResources: boolean;

  /**
   * Default values for missing fields.
   */
  readonly defaults: {
    readonly environment: "dev" | "staging" | "prod";
    readonly slaTarget: string;
  };

  /**
   * Required fields that must be extracted or inferred.
   */
  readonly requiredFields: readonly string[];
}

/**
 * Default Requirements configuration.
 */
export const DEFAULT_REQUIREMENTS_CONFIG: RequirementsConfig = {
  executionRules: createExecutionRules({
    retryable: true,
    maxRetries: 2,
    skippable: false,
    blocking: true,
    terminal: false,
    mustExecuteAfter: ["planner"],
    timeoutMs: 15000,
  }),
  estimateResources: true,
  defaults: {
    environment: "dev",
    slaTarget: "99%",
  },
  requiredFields: [
    "description",
    "expectedUsers",
    "monthlyBudget",
    "workloadClassification",
  ],
};
