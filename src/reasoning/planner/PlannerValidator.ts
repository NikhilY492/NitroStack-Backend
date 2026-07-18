/**
 * Planner stage validator.
 */

import type { AgentState } from "../../../schemas/state";
import type { ValidationRule } from "../common/Validation";
import { validateState } from "../common/Validation";

/**
 * Validation rules for Planner stage inputs.
 */
export const PLANNER_INPUT_RULES: readonly ValidationRule[] = [
  {
    id: "session-id-exists",
    description: "Session ID must exist",
    required: true,
    validate: (state: AgentState) => !!state.sessionId,
    errorMessage: "Session ID is required",
  },
  {
    id: "planner-not-completed",
    description: "Planner should not have already completed",
    required: false,
    validate: (state: AgentState) => !state.completedStages.includes("planner"),
    errorMessage: "Planner has already completed",
  },
];

/**
 * Validation rules for Planner stage outputs.
 */
export const PLANNER_OUTPUT_RULES: readonly ValidationRule[] = [
  {
    id: "reasoning-exists",
    description: "Planner reasoning must be recorded",
    required: true,
    validate: (state: AgentState) => !!state.reasoning.planner,
    errorMessage: "Planner reasoning was not recorded",
  },
  {
    id: "can-proceed-determined",
    description: "Must determine if workflow can proceed",
    required: true,
    validate: (state: AgentState) =>
      state.reasoning.planner !== undefined &&
      typeof state.reasoning.planner === "object" &&
      "canProceed" in state.reasoning.planner,
    errorMessage: "Planner did not determine if workflow can proceed",
  },
];

/**
 * Validates Planner stage inputs.
 */
export function validatePlannerInputs(state: AgentState) {
  return validateState(state, PLANNER_INPUT_RULES);
}

/**
 * Validates Planner stage outputs.
 */
export function validatePlannerOutputs(state: AgentState) {
  return validateState(state, PLANNER_OUTPUT_RULES);
}
