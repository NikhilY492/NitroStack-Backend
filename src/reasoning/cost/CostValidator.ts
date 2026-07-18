/**
 * Cost Analyst stage validator.
 */

import type { AgentState } from "../../../schemas/state";
import type { ValidationRule } from "../common/Validation";
import { validateState } from "../common/Validation";

/**
 * Validation rules for Cost stage inputs.
 */
export const COST_INPUT_RULES: readonly ValidationRule[] = [
  {
    id: "architecture-completed",
    description: "Architecture stage must have completed",
    required: true,
    validate: (state: AgentState) => state.completedStages.includes("architect"),
    errorMessage: "Architecture stage has not completed",
  },
  {
    id: "architecture-exists",
    description: "Architecture set must exist",
    required: true,
    validate: (state: AgentState) => !!state.architecture,
    errorMessage: "Architecture set is missing",
  },
  {
    id: "candidates-exist",
    description: "Candidates must exist",
    required: true,
    validate: (state: AgentState) =>
      !!state.architecture?.candidates && state.architecture.candidates.length > 0,
    errorMessage: "No candidates to price",
  },
];

/**
 * Validation rules for Cost stage outputs.
 */
export const COST_OUTPUT_RULES: readonly ValidationRule[] = [
  {
    id: "pricing-exists",
    description: "Session pricing must exist",
    required: true,
    validate: (state: AgentState) => !!state.pricing,
    errorMessage: "Pricing was not computed",
  },
  {
    id: "all-candidates-priced",
    description: "All candidates must have pricing",
    required: true,
    validate: (state: AgentState) => {
      if (!state.architecture?.candidates || !state.pricing) return false;
      return state.architecture.candidates.every(
        (c) => !!state.pricing?.[c.id]
      );
    },
    errorMessage: "Some candidates are missing pricing",
  },
  {
    id: "reasoning-exists",
    description: "Cost reasoning must be recorded",
    required: true,
    validate: (state: AgentState) => !!state.reasoning.cost,
    errorMessage: "Cost reasoning was not recorded",
  },
];

/**
 * Validates Cost stage inputs.
 */
export function validateCostInputs(state: AgentState) {
  return validateState(state, COST_INPUT_RULES);
}

/**
 * Validates Cost stage outputs.
 */
export function validateCostOutputs(state: AgentState) {
  return validateState(state, COST_OUTPUT_RULES);
}
