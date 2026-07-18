/**
 * Policy Validator stage behavior specification.
 */

import type { Behavior } from "../common/Behavior";

/**
 * Policy Validator behavior specification.
 * 
 * Evaluates every candidate architecture against company policy rules.
 */
export const POLICY_BEHAVIOR: Behavior = {
  stage: "policy",

  objective:
    "Validate every candidate architecture against company policy rules and record compliance results",

  responsibilities: [
    "Read company policy rules from policy.yaml",
    "Evaluate each candidate against every applicable rule",
    "Record pass/fail for each rule per candidate",
    "Compute overall policy pass rate per candidate",
    "Identify critical policy failures",
    "Document which policies were evaluated",
    "Handle policy file read failures gracefully",
  ],

  expectedInputs: {
    requiredStages: ["planner", "requirements", "architect", "cost"],
    requiredStateFields: [
      "sessionId",
      "requirements",
      "architecture",
      "pricing",
    ],
  },

  expectedOutputs: {
    stateFields: ["policyResults", "reasoning.policy"],
    reasoningType: "PolicyReasoning",
    terminal: false,
  },

  successCriteria: [
    "Every candidate has policy check results",
    "All applicable rules have been evaluated",
    "Pass/fail decisions are recorded for each rule",
    "Critical failures are identified",
    "Policy reasoning includes summary of results",
  ],

  failureConditions: [
    "Cannot read policy file",
    "No policy rules are defined",
    "Cannot evaluate any policy rule",
    "All candidates fail all critical policies",
  ],

  assumptions: [
    "Policy file exists and is valid YAML",
    "Policy rules specify which environments they apply to",
    "Some rules may be critical (must pass) vs advisory",
    "Candidates can fail policies without blocking the workflow",
    "The Coordinator will decide how to handle policy failures",
  ],

  stateUpdates: [
    "Writes PolicyResults to state.policyResults",
    "Updates each candidate's policyChecks field",
    "Writes PolicyReasoning to state.reasoning.policy",
    "Does not reject candidates (Coordinator's responsibility)",
    "May call read_company_policies tool (Phase 4)",
  ],
};
