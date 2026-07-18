/**
 * Policy Validator stage validator.
 */

import type { AgentState } from "../../schemas/state";
import type { ValidationRule } from "../common/Validation";
import { validateState } from "../common/Validation";

/**
 * Validation rules for Policy stage inputs.
 */
export const POLICY_INPUT_RULES: readonly ValidationRule[] = [
  {
    id: "cost-completed",
    description: "Cost stage must have completed",
    required: true,
    validate: (state: AgentState) => state.completedStages.includes("cost"),
    errorMessage: "Cost stage has not completed",
  },
  {
    id: "pricing-exists",
    description: "Pricing must exist",
    required: true,
    validate: (state: AgentState) => !!state.pricing,
    errorMessage: "Pricing is missing",
  },
  {
    id: "architecture-exists",
    description: "Architecture must exist",
    required: true,
    validate: (state: AgentState) => !!state.architecture,
    errorMessage: "Architecture is missing",
  },
];

/**
 * Validation rules for Policy stage outputs.
 */
export const POLICY_OUTPUT_RULES: readonly ValidationRule[] = [
  {
    id: "policy-results-exist",
    description: "Policy results must exist",
    required: true,
    validate: (state: AgentState) => !!state.policyResults,
    errorMessage: "Policy results were not computed",
  },
  {
    id: "all-candidates-validated",
    description: "All candidates must have policy results",
    required: true,
    validate: (state: AgentState) => {
      if (!state.architecture?.candidates || !state.policyResults) return false;
      return state.architecture.candidates.every(
        (c: any) => !!state.policyResults?.[c.id]
      );
    },
    errorMessage: "Some candidates are missing policy results",
  },
  {
    id: "reasoning-exists",
    description: "Policy reasoning must be recorded",
    required: true,
    validate: (state: AgentState) => !!state.reasoning.policy,
    errorMessage: "Policy reasoning was not recorded",
  },
];

/**
 * Validates Policy stage inputs.
 */
export function validatePolicyInputs(state: AgentState) {
  return validateState(state, POLICY_INPUT_RULES);
}

/**
 * Validates Policy stage outputs.
 */
export function validatePolicyOutputs(state: AgentState) {
  return validateState(state, POLICY_OUTPUT_RULES);
}
