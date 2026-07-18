/**
 * Agent State - The central data structure for the Agent Runtime.
 * 
 * This object flows through all six reasoning stages and accumulates
 * information as each stage executes. It represents the complete context
 * of a single infrastructure planning session.
 * 
 * Design principles:
 * - Immutable fields (readonly)
 * - No methods - pure data structure
 * - Additive only - stages add information, never remove it
 * - Closely follows Section 6 of the architecture document
 */

import type {
  Requirements,
  ArchitectureSet,
  SessionPricing,
  PolicyResults,
  SessionReasoning,
  ApprovalStatus,
  StageName,
  ToolCallRecord,
} from "../src/types";

/**
 * The complete agent state for a single infrastructure planning session.
 * 
 * This is the single source of truth during execution. Every reasoning stage
 * reads from and writes to this object.
 */
export interface AgentState {
  /**
   * Unique identifier for this session.
   */
  readonly sessionId: string;

  /**
   * Structured requirements (populated by Requirements Extractor).
   */
  readonly requirements?: Requirements;

  /**
   * All candidate architectures (populated by Architecture Designer,
   * enhanced by Cost Analyst and Policy Validator).
   */
  readonly architecture?: ArchitectureSet;

  /**
   * Pricing information for all candidates (populated by Cost Analyst).
   */
  readonly pricing?: SessionPricing;

  /**
   * Policy validation results for all candidates (populated by Policy Validator).
   */
  readonly policyResults?: PolicyResults;

  /**
   * Reasoning produced by each stage (accumulated throughout execution).
   */
  readonly reasoning: SessionReasoning;

  /**
   * Current approval status (managed by Coordinator and approval flow).
   */
  readonly approvalStatus: ApprovalStatus;

  /**
   * Generated Terraform HCL for the recommended candidate
   * (populated by Coordinator after generate_terraform).
   */
  readonly terraform?: string;

  /**
   * The stage currently being executed.
   */
  readonly currentStage?: StageName;

  /**
   * Stages that have completed successfully.
   */
  readonly completedStages: readonly StageName[];

  /**
   * Errors encountered during execution (if any).
   */
  readonly errors: readonly StateError[];

  /**
   * Session-level metadata.
   */
  readonly metadata: StateMetadata;

  /**
   * Key timestamps for this session.
   */
  readonly timestamps: StateTimestamps;

  /**
   * Record of all tool calls made during this session.
   */
  readonly toolCalls?: readonly ToolCallRecord[];
}

/**
 * Error encountered during agent execution.
 */
export interface StateError {
  /**
   * Which stage the error occurred in.
   */
  readonly stage: StageName;

  /**
   * Error code.
   */
  readonly code: string;

  /**
   * Human-readable error message.
   */
  readonly message: string;

  /**
   * When the error occurred.
   */
  readonly timestamp: string;

  /**
   * Whether execution recovered from this error.
   */
  readonly recovered: boolean;

  /**
   * Additional error details.
   */
  readonly details?: unknown;
}

/**
 * Session-level metadata.
 */
export interface StateMetadata {
  /**
   * User or system that initiated this session.
   */
  readonly initiatedBy?: string;

  /**
   * Target cloud provider (e.g., "aws", "azure", "gcp").
   */
  readonly cloudProvider?: string;

  /**
   * Target region.
   */
  readonly region?: string;

  /**
   * Working directory for Terraform operations.
   */
  readonly workingDirectory?: string;

  /**
   * Any additional context provided by the user.
   */
  readonly userContext?: Record<string, unknown>;

  /**
   * Extensible field for additional metadata.
   */
  readonly custom?: Record<string, unknown>;
}

/**
 * Key timestamps tracking session lifecycle.
 */
export interface StateTimestamps {
  /**
   * When the session was created.
   */
  readonly sessionStarted: string;

  /**
   * When the last stage completed (or failed).
   */
  readonly lastUpdated: string;

  /**
   * When the session completed (if finished).
   */
  readonly sessionCompleted?: string;

  /**
   * When the analysis was presented to the user (if reached Coordinator).
   */
  readonly analysisPresentedAt?: string;

  /**
   * When the user made an approval decision (if decided).
   */
  readonly approvalDecidedAt?: string;
}
