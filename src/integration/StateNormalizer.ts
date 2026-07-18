/**
 * Normalizes state between AI Runtime and Backend representations.
 * Handles conversion without duplicating the AgentState definition.
 */

import type { AgentState } from "../schemas/state";
import type { 
  Requirements,
  ArchitectureSet,
  SessionPricing,
  PolicyResults,
  SessionReasoning,
} from "../types";

/**
 * Backend state representation.
 * Matches the AI Runtime types exactly - no conversion needed.
 */
export interface BackendState {
  sessionId: string;
  requirements?: Requirements;
  architecture?: ArchitectureSet;
  pricing?: SessionPricing;
  policyResults?: PolicyResults;
  reasoning?: SessionReasoning;
  approvalStatus?: "pending" | "approved" | "rejected";
  terraform?: string;
}

/**
 * Normalizes state between AI and Backend representations.
 * Since both use the same types, this is mostly a pass-through.
 */
export class StateNormalizer {
  /**
   * Convert AI Runtime AgentState to Backend state format.
   * Useful for sending state to backend services.
   */
  static toBackendState(aiState: AgentState): BackendState {
    return {
      sessionId: aiState.sessionId,
      requirements: aiState.requirements,
      architecture: aiState.architecture,
      pricing: aiState.pricing,
      policyResults: aiState.policyResults,
      reasoning: aiState.reasoning,
      approvalStatus: aiState.approvalStatus,
      terraform: aiState.terraform,
    };
  }

  /**
   * Convert Backend state to AI Runtime AgentState format.
   * Useful for loading state from backend.
   */
  static toAIState(backendState: BackendState): Partial<AgentState> {
    return {
      sessionId: backendState.sessionId,
      requirements: backendState.requirements,
      architecture: backendState.architecture,
      pricing: backendState.pricing,
      policyResults: backendState.policyResults,
      reasoning: backendState.reasoning as SessionReasoning,
      approvalStatus: backendState.approvalStatus ?? "pending",
      terraform: backendState.terraform,
    };
  }

  /**
   * Merge backend state updates into AI state.
   * Non-destructive: adds new data, doesn't remove existing.
   */
  static mergeBackendState(
    aiState: AgentState,
    backendUpdate: Partial<BackendState>
  ): AgentState {
    return {
      sessionId: aiState.sessionId,
      completedStages: aiState.completedStages,
      errors: aiState.errors,
      metadata: aiState.metadata,
      timestamps: aiState.timestamps,
      toolCalls: aiState.toolCalls,
      currentStage: aiState.currentStage,
      requirements: backendUpdate.requirements ?? aiState.requirements,
      architecture: backendUpdate.architecture ?? aiState.architecture,
      pricing: backendUpdate.pricing 
        ? { ...aiState.pricing, ...backendUpdate.pricing }
        : aiState.pricing,
      policyResults: backendUpdate.policyResults
        ? { ...aiState.policyResults, ...backendUpdate.policyResults }
        : aiState.policyResults,
      reasoning: backendUpdate.reasoning
        ? { ...aiState.reasoning, ...backendUpdate.reasoning }
        : aiState.reasoning,
      approvalStatus: backendUpdate.approvalStatus ?? aiState.approvalStatus,
      terraform: backendUpdate.terraform ?? aiState.terraform,
    };
  }

  /**
   * Extract tool arguments from AI state for backend tools.
   * Maps AI state fields to tool input parameters.
   */
  static extractToolArguments(
    toolName: string,
    aiState: AgentState
  ): Record<string, unknown> {
    const args: Record<string, unknown> = {};

    switch (toolName) {
      case "read_existing_infrastructure":
        args.workingDir = aiState.metadata?.workingDirectory ?? "./";
        break;

      case "read_company_policies":
        // No arguments needed
        break;

      case "estimate_resource_requirements":
        if (aiState.requirements) {
          args.workloadDescription = aiState.requirements.description;
          args.expectedUsers = aiState.requirements.expectedUsers;
        }
        break;

      case "generate_architecture_candidates":
      case "generate_candidate_architectures":
        if (aiState.requirements) {
          args.requirements = aiState.requirements;
          args.constraints = {
            monthlyBudget: aiState.requirements.monthlyBudget,
            slaTarget: aiState.requirements.slaTarget,
            environment: aiState.requirements.environment,
          };
        }
        break;

      case "get_cloud_pricing":
        if (aiState.architecture?.candidates?.[0]) {
          args.candidate = aiState.architecture.candidates[0];
        }
        break;

      case "compare_architectures":
        if (aiState.architecture?.candidates && aiState.requirements) {
          args.candidates = aiState.architecture.candidates;
          args.policyResults = aiState.policyResults ?? {};
          args.constraints = {
            monthlyBudget: aiState.requirements.monthlyBudget,
            slaTarget: aiState.requirements.slaTarget,
          };
        }
        break;

      case "generate_terraform":
        if (aiState.architecture?.candidates?.[0]) {
          args.candidate = aiState.architecture.candidates[0];
        }
        break;

      default:
        // Unknown tool, return empty args
        break;
    }

    return args;
  }
}
