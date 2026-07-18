/**
 * Planner stage behavior specification.
 */

import type { Behavior } from "../common/Behavior";

/**
 * Planner behavior specification.
 * 
 * The Planner is the entry point of the agent workflow. Its job is to
 * understand user intent, identify missing information, and determine
 * the planning strategy.
 */
export const PLANNER_BEHAVIOR: Behavior = {
  stage: "planner",

  objective:
    "Triage the user's prompt and determine whether the workflow can proceed or if clarification is needed",

  responsibilities: [
    "Parse and understand the natural language prompt",
    "Identify whether sufficient information exists to proceed",
    "Detect if this is a resumed session (existing state found)",
    "Determine the next action (proceed, ask user, or resume)",
    "Record high-level observations about the prompt",
  ],

  expectedInputs: {
    requiredStages: [],
    requiredStateFields: ["sessionId"],
  },

  expectedOutputs: {
    stateFields: ["reasoning.planner"],
    reasoningType: "PlannerReasoning",
    terminal: false,
  },

  successCriteria: [
    "Determines whether workflow can proceed",
    "Identifies if clarification is needed",
    "Records meaningful observations about the prompt",
    "Sets appropriate next action",
  ],

  failureConditions: [
    "Cannot parse or understand the prompt structure",
    "Encounters invalid session state",
    "Cannot determine any viable next action",
  ],

  assumptions: [
    "User has provided some form of infrastructure request",
    "Session state is valid and accessible",
    "The prompt is in natural language (not structured data)",
  ],

  stateUpdates: [
    "Writes PlannerReasoning to state.reasoning.planner",
    "Does not modify requirements, architecture, or other state fields",
    "May set metadata about the session",
  ],
};
