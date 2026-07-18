/**
 * Barrel export for all shared types.
 * 
 * This provides a single import point for all type definitions
 * used throughout the Agent Runtime.
 */

// Requirements
export type {
  Requirements,
  RequirementConstraints,
  ResourceRequirements,
} from "./requirements";

// Architecture
export type {
  CandidateArchitecture,
  ComputeType,
  DatabaseType,
  ScalingType,
  CandidatePricing,
  PricingBreakdown,
  PolicyCheckResult,
  ArchitectureSet,
} from "./architecture";

// Pricing
export type {
  ResourceType,
  PricingRequest,
  PricingResponse,
  SessionPricing,
  CandidatePricingBreakdown,
  PricingComparison,
} from "./pricing";

// Policy
export type {
  PolicyRule,
  PolicySeverity,
  PolicyCheck,
  PolicyEvaluation,
  PolicyResults,
  PolicyValidationSummary,
} from "./policy";

// Reasoning
export type {
  PlannerReasoning,
  RequirementsReasoning,
  ArchitectureReasoning,
  RejectedOption,
  CostReasoning,
  PricingFailure,
  PolicyReasoning,
  CoordinatorReasoning,
  TradeoffAnalysis,
  CandidateRejection,
  SessionReasoning,
  CoordinatorOutput,
} from "./reasoning";

// Approval
export type {
  ApprovalStatus,
  ApprovalRequest,
  ApprovalResponse,
  ApprovalStatusResponse,
  ApprovalRecord,
} from "./approval";

// Stage
export type {
  StageName,
  StageStatus,
  StageResult,
  StageError,
  StageExecution,
  StageConfig,
} from "./stage";

// Tool
export type {
  ToolRequest,
  ToolResponse,
  ToolStatus,
  ToolResult,
  ToolSuccess,
  ToolFailure,
  ToolError,
  ToolCallRecord,
  ToolExecutionConfig,
} from "./tool";
