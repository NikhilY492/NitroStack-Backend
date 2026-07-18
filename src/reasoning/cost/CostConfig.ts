/**
 * Cost Analyst stage configuration.
 */

import type { ExecutionRules } from "../common/ExecutionRules";
import { createExecutionRules } from "../common/ExecutionRules";

/**
 * Cost stage configuration.
 */
export interface CostConfig {
  /**
   * Execution rules.
   */
  readonly executionRules: ExecutionRules;

  /**
   * Default currency for pricing.
   */
  readonly currency: string;

  /**
   * Whether to fail if any pricing lookup fails.
   */
  readonly failOnPricingError: boolean;

  /**
   * Fallback cost when pricing lookup fails.
   */
  readonly fallbackCost: number;

  /**
   * Whether to use static pricing or live API.
   */
  readonly useStaticPricing: boolean;
}

/**
 * Default Cost configuration.
 */
export const DEFAULT_COST_CONFIG: CostConfig = {
  executionRules: createExecutionRules({
    retryable: true,
    maxRetries: 2,
    skippable: false,
    blocking: true,
    terminal: false,
    mustExecuteAfter: ["planner", "requirements", "architect"],
    timeoutMs: 20000,
  }),
  currency: "INR",
  failOnPricingError: false,
  fallbackCost: 1000,
  useStaticPricing: true,
};
