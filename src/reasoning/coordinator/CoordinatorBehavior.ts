/**
 * Coordinator stage behavior specification.
 */

import type { Behavior } from "../common/Behavior";

/**
 * Coordinator behavior specification.
 * 
 * The final reasoning stage that compares all candidates, chooses a
 * recommendation, explains the decision, and generates Terraform.
 */
export const COORDINATOR_BEHAVIOR: Behavior = {
  stage: "coordinator",

  objective:
    "Compare all candidates, select the best recommendation, explain the decision, and generate Terraform",

  responsibilities: [
    "Call compare_architectures to get deterministic scores for each candidate",
    "Reason over the six decision factors (Section 8): cost, performance, reliability, scalability, policy compliance, operational complexity",
    "Select the recommended candidate",
    "Write rejection reasons for non-recommended candidates",
    "Compute confidence score (0-1) for the recommendation",
    "Produce TradeoffAnalysis explaining each of the six factors",
    "Generate Terraform for the recommended candidate only",
    "Assemble InfrastructureAnalysis payload for the dashboard",
    "Call present_analysis to render the dashboard",
    "Record full CoordinatorReasoning with summary bullets",
  ],

  expectedInputs: {
    requiredStages: ["planner", "requirements", "architect", "cost", "policy"],
    requiredStateFields: [
      "sessionId",
      "requirements",
      "architecture",
      "pricing",
      "policyResults",
    ],
  },

  expectedOutputs: {
    stateFields: ["terraform", "reasoning.coordinator", "architecture.recommendedId"],
    reasoningType: "CoordinatorReasoning",
    terminal: true,
  },

  successCriteria: [
    "Selects exactly one recommended candidate",
    "All non-recommended candidates have rejection reasons",
    "TradeoffAnalysis covers all six factors",
    "Confidence score is set",
    "Terraform is generated for recommended candidate",
    "Summary bullets explain the key decisions",
    "InfrastructureAnalysis is sent to dashboard",
  ],

  failureConditions: [
    "Cannot select any candidate as recommendation",
    "All candidates fail hard budget or SLA constraints",
    "Terraform generation fails for recommended candidate",
    "Cannot assemble InfrastructureAnalysis payload",
  ],

  assumptions: [
    "All previous stages have completed successfully",
    "At least one candidate satisfies hard constraints (budget, SLA)",
    "compare_architectures returns deterministic scores",
    "Terraform generator supports all MVP catalog options",
    "Dashboard is available to receive InfrastructureAnalysis",
    "Human approval workflow is outside this stage's scope",
  ],

  stateUpdates: [
    "Writes CoordinatorReasoning to state.reasoning.coordinator",
    "Sets state.architecture.recommendedId",
    "Writes Terraform HCL to state.terraform",
    "Updates rejectionReason on non-recommended candidates",
    "Sets approvalStatus to 'pending'",
    "May call compare_architectures tool (Phase 4)",
    "May call generate_terraform tool (Phase 4)",
    "May call present_analysis tool (Phase 4)",
  ],
};
