/**
 * Coordinator prompt builder.
 */

import type { AgentState } from "../schemas/state";
import type { PromptBuilder } from "../llm/PromptBuilder";
import { formatJSON } from "../llm/PromptBuilder";

const COORDINATOR_TEMPLATE = `# Coordinator Stage

You are the Coordinator stage of an infrastructure planning agent.

## Objective
Compare all candidates, select the best recommendation, explain the decision, and provide final summary.

## Responsibilities
- Reason over six decision factors: cost, performance, reliability, scalability, policy compliance, operational complexity
- Select the recommended candidate
- Write rejection reasons for non-recommended candidates
- Compute confidence score (0-1)
- Produce tradeoff analysis
- Generate summary bullets

## Input Context
{{CONTEXT}}

## Six Decision Factors
1. **Cost**: Total monthly cost vs budget
2. **Performance**: Ability to meet expected load
3. **Reliability**: SLA achievement potential
4. **Scalability**: Growth headroom
5. **Policy Compliance**: Pass rate on policy checks
6. **Operational Complexity**: Management overhead

## Instructions
1. Compare all candidates across the six factors
2. Select ONE recommendation
3. Explain why others were rejected
4. Provide confidence score

## Output Format
Respond with ONLY a JSON object matching this structure:
\`\`\`json
{
  "recommendation": {
    "recommendedCandidateId": "cand-a",
    "summary": [
      "ECS selected for optimal cost/performance balance",
      "ARM instances reduce compute cost by 25%",
      "Auto-scaling enables traffic handling"
    ],
    "confidence": 0.85,
    "tradeoffAnalysis": {
      "cost": "Within budget at ₹29,000/month",
      "performance": "Meets expected RPS with headroom",
      "reliability": "Achieves 99.9% SLA with managed service",
      "scalability": "Auto-scaling handles 3x traffic spikes",
      "policyCompliance": "Passes all critical policies",
      "operationalComplexity": "Lower than self-managed alternatives"
    },
    "rejections": [
      {
        "candidateId": "cand-b",
        "reason": "Higher cost (₹35,000) with minimal performance benefit",
        "primaryFactors": ["cost", "operationalComplexity"]
      },
      {
        "candidateId": "cand-c",
        "reason": "Lambda unsuitable for sustained CPU-intensive workload",
        "primaryFactors": ["performance", "cost"]
      }
    ]
  }
}
\`\`\`

## Constraints
- Must recommend exactly ONE candidate
- All non-recommended candidates must have rejection reasons
- Confidence should reflect certainty of decision (0.6-1.0)
- Summary should be 2-4 concise bullets
- TradeoffAnalysis must cover ALL six factors

Return ONLY the JSON object, no other text.`;

/**
 * Builds prompts for the Coordinator stage.
 */
export class CoordinatorPrompt implements PromptBuilder {
  public build(state: AgentState): string {
    const context = {
      requirements: state.requirements,
      candidates: state.architecture?.candidates,
      pricing: state.pricing,
      policyResults: state.policyResults,
      allReasoning: {
        architect: state.reasoning.architect,
        cost: state.reasoning.cost,
        policy: state.reasoning.policy,
      },
    };

    return COORDINATOR_TEMPLATE.replace("{{CONTEXT}}", formatJSON(context));
  }
}
