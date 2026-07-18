/**
 * Planner stage implementation.
 * Entry point for the agent workflow.
 */

import type { StageName } from "../types";
import type { StageContext } from "../runtime/StageContext";
import type { AgentState } from "../../schemas/state";
import { BaseStage } from "./BaseStage";

/**
 * Planner stage - triages the prompt and decides next action.
 */
export class PlannerStage extends BaseStage {
  public readonly name: StageName = "planner";

  protected async executeInternal(_context: StageContext): Promise<unknown> {
    // Phase 3: Prompt generation happens here
    // Phase 4: LLM reasoning happens here
    
    // Placeholder: Just return basic reasoning
    return {
      canProceed: true,
      nextAction: "extract_requirements" as const,
      observations: ["Placeholder planner execution"],
      isResumedSession: false,
    };
  }

  public getNextStage(_state: AgentState): StageName | undefined {
    // Always proceed to requirements extraction
    return "requirements";
  }
}
