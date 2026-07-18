/**
 * Requirements Extractor stage behavior specification.
 */

import type { Behavior } from "../common/Behavior";

/**
 * Requirements Extractor behavior specification.
 * 
 * Transforms natural language into structured requirements that
 * downstream stages can reason about.
 */
export const REQUIREMENTS_BEHAVIOR: Behavior = {
  stage: "requirements",

  objective:
    "Extract structured requirements from the prompt and classify the workload",

  responsibilities: [
    "Extract expectedUsers from the prompt",
    "Extract monthlyBudget constraint",
    "Extract slaTarget (availability requirement)",
    "Determine the target environment (dev/staging/prod)",
    "Classify the workload (cpu-intensive, io-bound, batch, etc.)",
    "Identify additional constraints (region, compliance, etc.)",
    "Determine which fields were explicitly provided vs inferred",
    "Flag any missing critical information",
  ],

  expectedInputs: {
    requiredStages: ["planner"],
    requiredStateFields: ["sessionId", "reasoning.planner"],
  },

  expectedOutputs: {
    stateFields: ["requirements", "reasoning.requirements"],
    reasoningType: "RequirementsReasoning",
    terminal: false,
  },

  successCriteria: [
    "Extracts all available requirement fields",
    "Classifies the workload with rationale",
    "Distinguishes between extracted and inferred fields",
    "Identifies missing fields without blocking",
  ],

  failureConditions: [
    "Cannot extract any meaningful requirements",
    "Cannot classify workload at all",
    "Critical fields are missing and cannot be inferred",
  ],

  assumptions: [
    "Planner has determined the workflow can proceed",
    "The prompt contains some infrastructure-related information",
    "Default values can be used for missing non-critical fields",
    "Workload classification can be inferred from context",
  ],

  stateUpdates: [
    "Writes Requirements object to state.requirements",
    "Writes RequirementsReasoning to state.reasoning.requirements",
    "May call estimate_resource_requirements tool (Phase 4)",
  ],
};
