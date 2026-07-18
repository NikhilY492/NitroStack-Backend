/**
 * Requirements prompt builder.
 */

import type { AgentState } from "../schemas/state";
import type { PromptBuilder } from "../llm/PromptBuilder";
import { formatJSON } from "../llm/PromptBuilder";

const REQUIREMENTS_TEMPLATE = `# Requirements Extractor Stage

You are the Requirements Extractor stage of an infrastructure planning agent.

## Objective
Extract structured requirements from the prompt and classify the workload.

## Responsibilities
- Extract expectedUsers, monthlyBudget, slaTarget, environment
- Classify the workload (cpu-intensive, io-bound, batch, real-time, etc.)
- Identify which fields were explicitly provided vs inferred
- Flag any missing critical information

## Input Context
{{CONTEXT}}

## Workload Classification Tags
Choose from: cpu-intensive, io-bound, batch, real-time, production, dev, staging, low-scale, medium-scale, high-scale

## Output Format
Respond with ONLY a JSON object matching this structure:
\`\`\`json
{
  "requirements": {
    "description": "string",
    "expectedUsers": number,
    "monthlyBudget": number,
    "slaTarget": "99%" | "99.9%" | "99.99%",
    "environment": "dev" | "staging" | "prod",
    "workloadClassification": ["tag1", "tag2"]
  },
  "reasoning": {
    "extractedFields": ["field1", "field2"],
    "inferredFields": ["field3"],
    "missingFields": [],
    "classificationRationale": "string",
    "resourceEstimationPerformed": false
  }
}
\`\`\`

## Constraints
- Use reasonable defaults for missing non-critical fields
- expectedUsers: default to 10000 if not specified
- monthlyBudget: default to 50000 INR if not specified
- slaTarget: default to "99%" if not specified
- environment: infer from context or default to "dev"
- Always include at least 2 workload classification tags

Return ONLY the JSON object, no other text.`;

/**
 * Builds prompts for the Requirements stage.
 */
export class RequirementsPrompt implements PromptBuilder {
  public build(state: AgentState): string {
    const context = {
      plannerReasoning: state.reasoning.planner,
      prompt: "User infrastructure request (placeholder)",
    };

    return REQUIREMENTS_TEMPLATE.replace("{{CONTEXT}}", formatJSON(context));
  }
}
