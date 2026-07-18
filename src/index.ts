/**
 * Shift-Left FinOps: Autonomous Infrastructure Planning Agent
 * 
 * Main entry point for all agent layers.
 * Phase 1-5 exports organized by layer.
 */

// Phase 1: Shared types and state
export * from "./types";

export type { AgentState, StateError, StateMetadata, StateTimestamps } from "../schemas/state";
export {
  createEmptyState,
  createState,
  cloneState,
  touchState,
  markStageCompleted,
  setCurrentStage,
  updateApprovalStatus,
  completeSession,
  isEmptyState,
  isStageCompleted,
  isValidState,
} from "../schemas/state.schema";

export type {
  Identifiable,
  Timestamped,
  MetadataCarrier,
  Entity,
  Versioned,
  Labeled,
  Outcome,
} from "../schemas/interfaces";

// Phase 2: Runtime orchestration
export type { Stage } from "./stages/Stage";
export { BaseStage } from "./stages/BaseStage";
export type { Pipeline } from "./runtime/Pipeline";
export { StageRegistry } from "./runtime/StageRegistry";
export { StageFactory } from "./runtime/StageFactory";
export { AgentRuntime } from "./runtime/AgentRuntime";

// Phase 3: Behavior contracts
export type { Behavior } from "./reasoning/common/Behavior";
export type { BehaviorResult } from "./reasoning/common/BehaviorResult";
export type { ReasoningContext } from "./reasoning/common/ReasoningContext";
export type { ValidationRule, ValidationResult as ReasoningValidationResult } from "./reasoning/common/Validation";
export type { ExecutionRules } from "./reasoning/common/ExecutionRules";

// Phase 4: LLM integration
export { LLMClient } from "./llm/LLMClient";
export type { LLMProvider, LLMResult } from "./llm/LLMProvider";
export type { LLMConfig } from "./llm/LLMConfig";
export type { LLMResponse, StructuredResponse } from "./llm/LLMResponse";
export type { PromptBuilder } from "./llm/PromptBuilder";
export { ResponseParser } from "./llm/ResponseParser";
export { MockProvider } from "./llm/providers/MockProvider";

// Phase 5: Decision & tool layer
export type { Action, ActionResult, RetryPolicy } from "./decision/Action";
export {
  createAction,
  createActionResult,
  createDefaultRetryPolicy,
} from "./decision/Action";

export type { ExecutionPlan, PlannedAction, ActionStatus } from "./decision/ExecutionPlan";
export {
  createExecutionPlan,
  updatePlannedActionStatus,
  getNextExecutableAction,
  isPlanComplete,
  isPlanFailed,
} from "./decision/ExecutionPlan";

export type { ValidationError, ValidationResult as ActionValidationResult } from "./decision/ActionValidator";
export { ActionValidator } from "./decision/ActionValidator";

export type { LLMActionOutput, PlanningResult } from "./decision/ActionPlanner";
export { ActionPlanner } from "./decision/ActionPlanner";

// Tools
export type { Tool, ToolCapabilities, ValidationResult as ToolValidationResult } from "./tools/Tool";
export { BaseTool } from "./tools/Tool";

export type { ToolContext, ToolLogger, ToolMetrics } from "./tools/ToolContext";
export { createToolContext, NoOpLogger, NoOpMetrics } from "./tools/ToolContext";

export { ToolRegistry } from "./tools/ToolRegistry";
export type { RoutingResult, ActionToToolMapper } from "./tools/ToolRouter";
export { ToolRouter } from "./tools/ToolRouter";

export { ToolInvoker } from "./tools/ToolInvoker";
export { ToolExecutor } from "./tools/ToolExecutor";

export type { ToolResult } from "./tools/ToolResultMapper";
export { ToolResultMapper, BatchResultMapper } from "./tools/ToolResultMapper";

export {
  MockPricingTool,
  MockPolicyTool,
  MockArchitectureTool,
  MockTerraformTool,
  MockResourceEstimatorTool,
  createMockTools,
} from "./tools/MockToolProvider";

