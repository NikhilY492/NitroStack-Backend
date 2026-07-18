/**
 * Architecture Designer stage validator.
 */

import type { AgentState } from "../../schemas/state";
import type { ValidationRule } from "../common/Validation";
import { validateState } from "../common/Validation";

/**
 * Validation rules for Architecture stage inputs.
 */
export const ARCHITECTURE_INPUT_RULES: readonly ValidationRule[] = [
  {
    id: "requirements-completed",
    description: "Requirements stage must have completed",
    required: true,
    validate: (state: AgentState) => state.completedStages.includes("requirements"),
    errorMessage: "Requirements stage has not completed",
  },
  {
    id: "requirements-exist",
    description: "Requirements must exist",
    required: true,
    validate: (state: AgentState) => !!state.requirements,
    errorMessage: "Requirements are missing",
  },
  {
    id: "workload-classified",
    description: "Workload must be classified",
    required: true,
    validate: (state: AgentState) =>
      !!state.requirements?.workloadClassification &&
      state.requirements.workloadClassification.length > 0,
    errorMessage: "Workload classification is missing",
  },
];

/**
 * Validation rules for Architecture stage outputs.
 */
export const ARCHITECTURE_OUTPUT_RULES: readonly ValidationRule[] = [
  {
    id: "architecture-exists",
    description: "Architecture set must exist",
    required: true,
    validate: (state: AgentState) => !!state.architecture,
    errorMessage: "Architecture set was not created",
  },
  {
    id: "has-three-candidates",
    description: "Must have exactly 3 candidates",
    required: true,
    validate: (state: AgentState) =>
      !!state.architecture?.candidates && state.architecture.candidates.length === 3,
    errorMessage: "Must generate exactly 3 candidates",
  },
  {
    id: "candidates-have-ids",
    description: "All candidates must have IDs",
    required: true,
    validate: (state: AgentState) =>
      state.architecture?.candidates.every((c: any) => !!c.id) ?? false,
    errorMessage: "Some candidates are missing IDs",
  },
  {
    id: "candidates-have-labels",
    description: "All candidates must have labels",
    required: true,
    validate: (state: AgentState) =>
      state.architecture?.candidates.every((c: any) => !!c.label) ?? false,
    errorMessage: "Some candidates are missing labels",
  },
  {
    id: "reasoning-exists",
    description: "Architecture reasoning must be recorded",
    required: true,
    validate: (state: AgentState) => !!state.reasoning.architect,
    errorMessage: "Architecture reasoning was not recorded",
  },
];

/**
 * Validates Architecture stage inputs.
 */
export function validateArchitectureInputs(state: AgentState) {
  return validateState(state, ARCHITECTURE_INPUT_RULES);
}

/**
 * Validates Architecture stage outputs.
 */
export function validateArchitectureOutputs(state: AgentState) {
  return validateState(state, ARCHITECTURE_OUTPUT_RULES);
}
