/**
 * Requirements Extractor stage validator.
 */

import type { AgentState } from "../../../schemas/state";
import type { ValidationRule } from "../common/Validation";
import { validateState } from "../common/Validation";

/**
 * Validation rules for Requirements stage inputs.
 */
export const REQUIREMENTS_INPUT_RULES: readonly ValidationRule[] = [
  {
    id: "planner-completed",
    description: "Planner must have completed",
    required: true,
    validate: (state: AgentState) => state.completedStages.includes("planner"),
    errorMessage: "Planner stage has not completed",
  },
  {
    id: "planner-reasoning-exists",
    description: "Planner reasoning must exist",
    required: true,
    validate: (state: AgentState) => !!state.reasoning.planner,
    errorMessage: "Planner reasoning is missing",
  },
];

/**
 * Validation rules for Requirements stage outputs.
 */
export const REQUIREMENTS_OUTPUT_RULES: readonly ValidationRule[] = [
  {
    id: "requirements-exist",
    description: "Requirements object must be populated",
    required: true,
    validate: (state: AgentState) => !!state.requirements,
    errorMessage: "Requirements were not extracted",
  },
  {
    id: "requirements-has-description",
    description: "Requirements must have a description",
    required: true,
    validate: (state: AgentState) =>
      !!state.requirements?.description && state.requirements.description.length > 0,
    errorMessage: "Requirements description is empty",
  },
  {
    id: "requirements-has-classification",
    description: "Workload must be classified",
    required: true,
    validate: (state: AgentState) =>
      !!state.requirements?.workloadClassification &&
      state.requirements.workloadClassification.length > 0,
    errorMessage: "Workload classification is missing",
  },
  {
    id: "reasoning-exists",
    description: "Requirements reasoning must be recorded",
    required: true,
    validate: (state: AgentState) => !!state.reasoning.requirements,
    errorMessage: "Requirements reasoning was not recorded",
  },
];

/**
 * Validates Requirements stage inputs.
 */
export function validateRequirementsInputs(state: AgentState) {
  return validateState(state, REQUIREMENTS_INPUT_RULES);
}

/**
 * Validates Requirements stage outputs.
 */
export function validateRequirementsOutputs(state: AgentState) {
  return validateState(state, REQUIREMENTS_OUTPUT_RULES);
}
