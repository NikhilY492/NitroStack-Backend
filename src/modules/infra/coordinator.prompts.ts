import { PromptDecorator as Prompt } from '@nitrostack/core';

/**
 * CoordinatorPrompts
 *
 * Defines MCP Prompts (selectable from NitroStudio's prompt library) that
 * automatically set up the Coordinator workflow. The user just types their
 * plain natural-language requirements — no tool names or JSON needed.
 */
export class CoordinatorPrompts {

  /**
   * The main "design_architecture" prompt.
   * The user selects this prompt in NitroStudio, fills in their requirements,
   * and the AI takes it from there — calling all the right tools automatically.
   */
  @Prompt({
    name: 'design_architecture',
    title: '🏗️ Design Cloud Architecture',
    description:
      'Acts as the Shift-Left FinOps Coordinator. You provide your workload requirements ' +
      'and the AI automatically estimates resources, generates 3 candidate architectures, ' +
      'prices them, checks company policies, scores them, generates Terraform for the best one, ' +
      'and delivers a clean Markdown architecture report.',
    arguments: [
      {
        name: 'requirements',
        description:
          'Describe your workload: what it does, expected users, environment (prod/dev/staging), ' +
          'SLA target, and monthly budget in INR. Example: ' +
          '"Image processing service, 50k MAU, prod, 99.9% SLA, ₹35,000/mo budget."',
        required: true,
      },
    ],
  })
  async designArchitecture(args: { requirements: string }) {
    const { requirements } = args;

    const systemInstruction = `You are the Shift-Left FinOps Coordinator — an expert cloud architect AI.

Your job is to fully automate the architecture design workflow. You MUST call the tools in this exact order:

1. **estimate_resource_requirements** — pass the workload description and estimated user count extracted from the requirements.
2. **generate_candidate_architectures** (or **generate_architecture_candidates**) — pass the full requirements object and constraints.
3. **get_cloud_pricing** — call this 3 times, once per candidate returned in step 2.
4. **read_company_policies** — no arguments needed.
5. **compare_architectures** — pass all 3 priced candidates, the policy results keyed by candidateId, and the budget/SLA constraints.
6. **generate_terraform** — call this ONLY for the highest-ranked candidate from step 5.
7. **format_analysis** — call this with the complete analysis payload (same schema as present_analysis). This returns { analysisId, markdown }.
8. Output ONLY the markdown string from step 7's result — do not add any commentary before or after it.

RULES:
- Do NOT call present_analysis. Use format_analysis instead (it outputs clean Markdown).
- Do NOT generate any JSON-Patch or SDUI layout code.
- Do NOT call read_resource on any widget URI.
- Complete all 7 steps before writing any response text.`;

    return [
      {
        role: 'system' as const,
        content: systemInstruction,
      },
      {
        role: 'user' as const,
        content: requirements,
      },
    ];
  }
}
