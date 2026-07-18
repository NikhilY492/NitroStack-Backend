/**
 * Cost Analyst stage behavior specification.
 */

import type { Behavior } from "../common/Behavior";

/**
 * Cost Analyst behavior specification.
 * 
 * Prices every candidate architecture and computes detailed cost breakdowns.
 */
export const COST_BEHAVIOR: Behavior = {
  stage: "cost",

  objective:
    "Price every candidate architecture and produce detailed cost breakdowns",

  responsibilities: [
    "Look up pricing for compute resources in each candidate",
    "Look up pricing for database resources in each candidate",
    "Look up pricing for cache resources (if present)",
    "Estimate network egress costs",
    "Estimate other infrastructure costs (load balancers, NAT gateways, etc.)",
    "Compute total monthly cost per candidate",
    "Generate cost breakdown (compute/storage/network/other)",
    "Handle pricing lookup failures gracefully",
    "Record observations about cost differences between candidates",
  ],

  expectedInputs: {
    requiredStages: ["planner", "requirements", "architect"],
    requiredStateFields: ["sessionId", "requirements", "architecture"],
  },

  expectedOutputs: {
    stateFields: ["pricing", "reasoning.cost"],
    reasoningType: "CostReasoning",
    terminal: false,
  },

  successCriteria: [
    "Every candidate has a complete cost breakdown",
    "All pricing lookups succeeded or failed gracefully",
    "Cost breakdown sums to total monthly cost",
    "Pricing failures are documented",
    "Observations capture meaningful cost differences",
  ],

  failureConditions: [
    "Cannot price any candidate",
    "All pricing lookups fail",
    "Cost breakdown is structurally invalid",
  ],

  assumptions: [
    "Architecture stage has generated 3 candidates",
    "Static pricing knowledge base is available (Phase 4)",
    "Pricing is monthly, in a single currency (INR or USD)",
    "Network egress can be estimated from expected traffic",
    "Pricing failures for individual resources are non-blocking",
  ],

  stateUpdates: [
    "Writes SessionPricing to state.pricing",
    "Updates each candidate's pricing field",
    "Writes CostReasoning to state.reasoning.cost",
    "Does not modify candidate structures (only adds pricing)",
    "May call get_cloud_pricing tool multiple times (Phase 4)",
  ],
};
