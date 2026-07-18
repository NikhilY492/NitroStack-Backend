/**
 * Architecture Designer stage implementation.
 */

import type { StageName } from "../types";
import type { StageContext } from "../runtime/StageContext";
import type { AgentState } from "../schemas/state";
import { BaseStage } from "./BaseStage";
import { createAction } from "../decision/Action";
import { createToolContext, NoOpLogger, NoOpMetrics } from "../tools/ToolContext";

/**
 * Architecture Designer stage - generates candidate architectures.
 */
export class ArchitectureStage extends BaseStage {
  public readonly name: StageName = "architect";

  protected async executeInternal(context: StageContext): Promise<unknown> {
    const state = context.state;

    // Check if we have tool executor
    if (!this.toolDeps?.toolExecutor) {
      this.log("No tool executor available, using placeholder", context);
      return { decisions: ["Placeholder"], candidatesGenerated: 0 };
    }

    if (!state.requirements) {
      throw new Error("Requirements not available");
    }

    try {
      // Invoke generate_candidate_architectures
      const action = createAction({
        id: "generate-candidates",
        name: "generate_candidate_architectures",
        purpose: "Generate 3 architecture candidates",
        arguments: {
          requirements: state.requirements,
          constraints: {
            monthlyBudget: state.requirements.monthlyBudget,
            slaTarget: state.requirements.slaTarget,
            environment: state.requirements.environment,
          },
        },
      });

      const toolContext = createToolContext(action, state, {
        logger: new NoOpLogger(),
        metrics: new NoOpMetrics(),
      });

      this.log("Generating candidates...", context);
      const result = await this.toolDeps.toolExecutor.executeAction(action, toolContext);

      if (!result.success) {
        throw new Error(`generate_candidate_architectures failed: ${result.error}`);
      }

      const candidateCount = result.data?.candidates?.length ?? 0;
      this.log(`Generated ${candidateCount} candidates`, context);

      return {
        decisions: [`Generated ${candidateCount} architecture candidates`],
        rejectedOptions: [],
        consideredExistingInfra: false,
        candidatesGenerated: candidateCount,
        candidates: result.data?.candidates ?? [],
      };
    } catch (error) {
      this.log(`Error: ${error}`, context);
      return { decisions: ["Error generating candidates"], candidatesGenerated: 0 };
    }
  }

  public getNextStage(_state: AgentState): StageName | undefined {
    // Proceed to cost analysis
    return "cost";
  }
}
