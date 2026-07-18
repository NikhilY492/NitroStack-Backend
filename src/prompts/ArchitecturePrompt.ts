/**
 * Architecture prompt builder.
 */

import type { AgentState } from "../schemas/state";
import type { PromptBuilder } from "../llm/PromptBuilder";
import { formatJSON } from "../llm/PromptBuilder";

const ARCHITECTURE_TEMPLATE = `# Architecture Designer Stage

You are the Architecture Designer stage of an infrastructure planning agent.

## Objective
Generate exactly 3 structurally distinct candidate architectures that satisfy the requirements.

## Responsibilities
- Analyze workload classification to determine suitable compute options
- Reject architecturally inappropriate options (e.g., Lambda for long-running CPU tasks)
- Select appropriate database, caching, scaling, and instance types
- Generate 3 meaningfully different candidates
- Document rejection rationale for excluded options

## Input Context
{{CONTEXT}}

## MVP Catalog (Section 9)
- Compute: ec2, ecs_fargate, lambda
- Database: postgresql, dynamodb
- Cache: true/false (Redis)
- Scaling: fixed, auto
- Instance Types: t3.medium, t3.large, t4g.medium, m5.large

## Instructions
Generate 3 candidate architectures that:
1. Differ in key dimensions (compute/database/cache)
2. Are appropriate for the workload classification
3. Stay within the MVP catalog

## Output Format
Respond with ONLY a JSON object matching this structure:
\`\`\`json
{
  "candidates": [
    {
      "id": "cand-a",
      "label": "ECS + PostgreSQL",
      "compute": "ecs_fargate",
      "database": "postgresql",
      "cache": false,
      "scaling": "auto",
      "instanceType": "t4g.medium"
    }
  ],
  "reasoning": {
    "decisions": ["decision1", "decision2"],
    "rejectedOptions": [],
    "consideredExistingInfra": false,
    "candidatesGenerated": 3
  }
}
\`\`\`

## Constraints
- Must generate exactly 3 candidates
- Candidates must be structurally different
- Only use options from MVP catalog
- Reject Lambda for sustained CPU-intensive workloads

Return ONLY the JSON object, no other text.`;

/**
 * Builds prompts for the Architecture stage.
 */
export class ArchitecturePrompt implements PromptBuilder {
  public build(state: AgentState): string {
    const context = {
      requirements: state.requirements,
      requirementsReasoning: state.reasoning.requirements,
    };

    return ARCHITECTURE_TEMPLATE.replace("{{CONTEXT}}", formatJSON(context));
  }
}
