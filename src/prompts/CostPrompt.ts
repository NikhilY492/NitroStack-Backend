/**
 * Cost prompt builder.
 */

import type { AgentState } from "../schemas/state";
import type { PromptBuilder } from "../llm/PromptBuilder";
import { formatJSON } from "../llm/PromptBuilder";

const COST_TEMPLATE = `# Cost Analyst Stage

You are the Cost Analyst stage of an infrastructure planning agent.

## Objective
Estimate monthly costs for every candidate architecture and produce detailed breakdowns.

## Input Context
{{CONTEXT}}

## Rough Pricing Guidelines (INR/month)
- t3.medium: ~2500
- t3.large: ~5000
- t4g.medium: ~2000
- m5.large: ~6000
- ECS Fargate: ~3000 base
- Lambda: usage-based, ~1000-5000
- PostgreSQL RDS: ~4000-8000
- DynamoDB: usage-based, ~2000-6000
- Redis: ~3000-5000

## Output Format
Respond with ONLY a JSON object matching this structure:
\`\`\`json
{
  "pricing": {
    "cand-a": {
      "monthlyCost": 29000,
      "compute": 18000,
      "storage": 6000,
      "networkEgress": 3000,
      "other": 2000
    }
  },
  "reasoning": {
    "pricingLookupsPerformed": 9,
    "pricingFailures": [],
    "observations": []
  }
}
\`\`\`

Return ONLY the JSON object, no other text.`;

/**
 * Builds prompts for the Cost stage.
 */
export class CostPrompt implements PromptBuilder {
  public build(state: AgentState): string {
    const context = {
      requirements: state.requirements,
      candidates: state.architecture?.candidates,
    };

    return COST_TEMPLATE.replace("{{CONTEXT}}", formatJSON(context));
  }
}
