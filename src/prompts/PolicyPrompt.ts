/**
 * Policy prompt builder.
 */

import type { AgentState } from "../schemas/state";
import type { PromptBuilder } from "../llm/PromptBuilder";
import { formatJSON } from "../llm/PromptBuilder";

const POLICY_TEMPLATE = `# Policy Validator Stage

You are the Policy Validator stage of an infrastructure planning agent.

## Objective
Validate every candidate architecture against company policy rules.

## Input Context
{{CONTEXT}}

## Sample Policy Rules
1. Budget Compliance: Dev environments must stay under defined budget
2. ARM Preference: Prefer ARM instances when application supports it
3. Auto Scaling: Production workloads should use auto-scaling

## Output Format
Respond with ONLY a JSON object matching this structure:
\`\`\`json
{
  "policyResults": {
    "cand-a": [
      {
        "policyId": "budget-compliance",
        "label": "Budget Compliance",
        "passed": true,
        "reason": null
      }
    ]
  },
  "reasoning": {
    "rulesEvaluated": 4,
    "summary": [],
    "criticalFailures": []
  }
}
\`\`\`

Return ONLY the JSON object, no other text.`;

/**
 * Builds prompts for the Policy stage.
 */
export class PolicyPrompt implements PromptBuilder {
  public build(state: AgentState): string {
    const context = {
      requirements: state.requirements,
      candidates: state.architecture?.candidates,
      pricing: state.pricing,
    };

    return POLICY_TEMPLATE.replace("{{CONTEXT}}", formatJSON(context));
  }
}
