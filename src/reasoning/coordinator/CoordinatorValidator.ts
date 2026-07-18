/**
 * Coordinator stage validator.
 */

import type { AgentState } from "../../schemas/state";
import type { ValidationRule } from "../common/Validation";
import { validateState } from "../common/Validation";

/**
 * Validation rules for Coordinator stage inputs.
 */
export const COORDINATOR_INPUT_RULES: readonly ValidationRule[] = [
  {
    id: "policy-completed",
    description: "Policy stage must have completed",
    required: true,
    validate: (state: AgentState) => state.completedStages.includes("policy"),
    errorMessage: "Policy stage has not completed",
  },
  {
    id: "all-data-exists",
    description: "All required data must exist",
    required: true,
    validate: (state: AgentState) =>
      !!state.requirements &&
      !!state.architecture &&
      !!state.pricing &&
      !!state.policyResults,
    errorMessage: "Missing required data from previous stages",
  },
  {
    id: "has-candidates",
    description: "Must have candidates to compare",
    required: true,
    validate: (state: AgentState) =>
      !!state.architecture?.candidates && state.architecture.candidates.length > 0,
    errorMessage: "No candidates available to compare",
  },
];

/**
 * Validation rules for Coordinator stage outputs.
 */
export const COORDINATOR_OUTPUT_RULES: readonly ValidationRule[] = [
  {
    id: "recommended-candidate-set",
    description: "Must select a recommended candidate",
    required: true,
    validate: (state: AgentState) => !!state.architecture?.recommendedId,
    errorMessage: "No candidate was recommended",
  },
  {
    id: "terraform-generated",
    description: "Terraform must be generated",
    required: true,
    validate: (state: AgentState) => !!state.terraform && state.terraform.length > 0,
    errorMessage: "Terraform was not generated",
  },
  {
    id: "coordinator-reasoning-exists",
    description: "Coordinator reasoning must be recorded",
    required: true,
    validate: (state: AgentState) => !!state.reasoning.coordinator,
    errorMessage: "Coordinator reasoning was not recorded",
  },
  {
    id: "has-summary",
    description: "Must have summary bullets",
    required: true,
    validate: (state: AgentState) => {
      const reasoning = state.reasoning.coordinator;
      return !!(
        reasoning &&
        typeof reasoning === "object" &&
        "summary" in reasoning &&
        Array.isArray(reasoning.summary) &&
        reasoning.summary.length > 0
      );
    },
    errorMessage: "Summary bullets are missing",
  },
  {
    id: "has-confidence",
    description: "Must have confidence score",
    required: true,
    validate: (state: AgentState) => {
      const reasoning = state.reasoning.coordinator;
      return !!(
        reasoning &&
        typeof reasoning === "object" &&
        "confidence" in reasoning &&
        typeof reasoning.confidence === "number"
      );
    },
    errorMessage: "Confidence score is missing",
  },
];

/**
 * Validates Coordinator stage inputs.
 */
export function validateCoordinatorInputs(state: AgentState) {
  return validateState(state, COORDINATOR_INPUT_RULES);
}

/**
 * Validates Coordinator stage outputs.
 */
export function validateCoordinatorOutputs(state: AgentState) {
  return validateState(state, COORDINATOR_OUTPUT_RULES);
}
