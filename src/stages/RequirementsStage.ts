/**
 * Requirements Extractor stage implementation.
 */

import type { StageName } from "../types";
import type { StageContext } from "../runtime/StageContext";
import type { AgentState } from "../../schemas/state";
import { BaseStage } from "./BaseStage";

/**
 * Requirements Extractor stage - extracts structured requirements.
 */
export class RequirementsStage extends BaseStage {
  public readonly name: StageName = "requirements";

  protected async executeInternal(_context: StageContext): Promise<unknown> {
    // Phase 3: Prompt generation happens here
    // Phase 4: LLM reasoning happens here
    // Phase 5: MCP tool calls (estimate_resource_requirements) happen here
    
    // Placeholder: Return basic reasoning
    return {
      extractedFields: ["expectedUsers", "monthlyBudget"],
      inferredFields: [],
      missingFields: [],
      classificationRationale: "Placeholder classification",
      resourceEstimationPerformed: false,
    };
  }

  public getNextStage(_state: AgentState): StageName | undefined {
    // Proceed to architecture design
    return "architect";
  }
}
