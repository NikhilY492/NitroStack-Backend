/**
 * Architecture Designer stage behavior specification.
 */

import type { Behavior } from "../common/Behavior";

/**
 * Architecture Designer behavior specification.
 * 
 * Generates candidate infrastructure architectures based on requirements
 * and constraints, ensuring meaningful diversity between options.
 */
export const ARCHITECTURE_BEHAVIOR: Behavior = {
  stage: "architect",

  objective:
    "Generate exactly 3 structurally distinct candidate architectures that satisfy the requirements",

  responsibilities: [
    "Analyze workload classification to determine suitable compute options",
    "Reject architecturally inappropriate options (e.g., Lambda for long-running CPU tasks)",
    "Select database type based on workload characteristics",
    "Determine if caching layer is beneficial",
    "Choose scaling strategy (fixed vs auto)",
    "Select instance types appropriate for the workload",
    "Generate exactly 3 meaningfully different candidates",
    "Ensure candidates differ in key architectural dimensions (compute/database/cache)",
    "Check existing infrastructure for integration opportunities",
    "Document rejection rationale for excluded options",
  ],

  expectedInputs: {
    requiredStages: ["planner", "requirements"],
    requiredStateFields: ["sessionId", "requirements", "reasoning.requirements"],
  },

  expectedOutputs: {
    stateFields: ["architecture", "reasoning.architect"],
    reasoningType: "ArchitectureReasoning",
    terminal: false,
  },

  successCriteria: [
    "Generates exactly 3 candidate architectures",
    "All candidates are structurally valid",
    "Candidates differ meaningfully (not cosmetic variations)",
    "Rejected options are documented with rationale",
    "Each candidate has a human-readable label",
    "Instance types are appropriate for workload",
  ],

  failureConditions: [
    "Cannot generate 3 distinct candidates",
    "All generated candidates are structurally identical",
    "Selected compute type is incompatible with workload",
    "Requirements are too vague to make architectural decisions",
  ],

  assumptions: [
    "Requirements stage has classified the workload",
    "MVP catalog (Section 9) defines available options",
    "3 distinct combinations can always be found within MVP scope",
    "Existing infrastructure is optional (greenfield is acceptable)",
    "All candidates use the same cloud provider and region",
  ],

  stateUpdates: [
    "Writes ArchitectureSet to state.architecture",
    "Populates candidates array with 3 unpriced architectures",
    "Writes ArchitectureReasoning to state.reasoning.architect",
    "Does not set recommendedId (Coordinator's responsibility)",
    "May call read_existing_infrastructure tool (Phase 4)",
    "May call generate_candidate_architectures tool (Phase 4)",
  ],
};
