/**
 * State utility functions for creating and manipulating agent state.
 * 
 * These are pure functions with no side effects:
 * - No runtime orchestration
 * - No stage execution
 * - No MCP calls
 * - Only state initialization and manipulation
 */

import type { AgentState, StateMetadata } from "./state";
import type { ApprovalStatus } from "../src/types";

/**
 * Creates an empty agent state with default values.
 * 
 * This is the initial state before any reasoning stages have executed.
 * 
 * @returns A new empty AgentState
 */
export function createEmptyState(): AgentState {
  const now = new Date().toISOString();

  return {
    sessionId: generateSessionId(),
    requirements: undefined,
    architecture: undefined,
    pricing: undefined,
    policyResults: undefined,
    reasoning: {},
    approvalStatus: "pending",
    terraform: undefined,
    currentStage: undefined,
    completedStages: [],
    errors: [],
    metadata: {},
    timestamps: {
      sessionStarted: now,
      lastUpdated: now,
    },
    toolCalls: [],
  };
}

/**
 * Creates a new agent state with provided initial values.
 * 
 * @param sessionId - Unique session identifier
 * @param metadata - Optional session metadata
 * @returns A new AgentState initialized with provided values
 */
export function createState(
  sessionId: string,
  metadata?: Partial<StateMetadata>
): AgentState {
  const now = new Date().toISOString();

  return {
    sessionId,
    requirements: undefined,
    architecture: undefined,
    pricing: undefined,
    policyResults: undefined,
    reasoning: {},
    approvalStatus: "pending",
    terraform: undefined,
    currentStage: undefined,
    completedStages: [],
    errors: [],
    metadata: metadata || {},
    timestamps: {
      sessionStarted: now,
      lastUpdated: now,
    },
    toolCalls: [],
  };
}

/**
 * Creates a deep clone of an agent state.
 * 
 * Useful for creating immutable updates without mutating the original state.
 * 
 * @param state - The state to clone
 * @returns A deep clone of the input state
 */
export function cloneState(state: AgentState): AgentState {
  return JSON.parse(JSON.stringify(state)) as AgentState;
}

/**
 * Updates the lastUpdated timestamp in the state.
 * 
 * @param state - The state to update
 * @returns A new state with updated timestamp
 */
export function touchState(state: AgentState): AgentState {
  return {
    ...state,
    timestamps: {
      ...state.timestamps,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Marks a stage as completed in the state.
 * 
 * @param state - The current state
 * @param stageName - The stage that completed
 * @returns A new state with the stage marked as completed
 */
export function markStageCompleted(
  state: AgentState,
  stageName: AgentState["currentStage"]
): AgentState {
  if (!stageName) return state;

  return {
    ...state,
    completedStages: [...state.completedStages, stageName],
    currentStage: undefined,
    timestamps: {
      ...state.timestamps,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Sets the current stage in the state.
 * 
 * @param state - The current state
 * @param stageName - The stage now executing
 * @returns A new state with current stage set
 */
export function setCurrentStage(
  state: AgentState,
  stageName: AgentState["currentStage"]
): AgentState {
  return {
    ...state,
    currentStage: stageName,
    timestamps: {
      ...state.timestamps,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Updates the approval status in the state.
 * 
 * @param state - The current state
 * @param status - The new approval status
 * @returns A new state with updated approval status
 */
export function updateApprovalStatus(
  state: AgentState,
  status: ApprovalStatus
): AgentState {
  const now = new Date().toISOString();
  
  return {
    ...state,
    approvalStatus: status,
    timestamps: {
      ...state.timestamps,
      lastUpdated: now,
      approvalDecidedAt: status !== "pending" ? now : state.timestamps.approvalDecidedAt,
    },
  };
}

/**
 * Marks the session as completed.
 * 
 * @param state - The current state
 * @returns A new state with session completed timestamp
 */
export function completeSession(state: AgentState): AgentState {
  const now = new Date().toISOString();
  
  return {
    ...state,
    timestamps: {
      ...state.timestamps,
      lastUpdated: now,
      sessionCompleted: now,
    },
  };
}

/**
 * Checks if a state is empty (no requirements or architecture yet).
 * 
 * @param state - The state to check
 * @returns True if the state has no meaningful data yet
 */
export function isEmptyState(state: AgentState): boolean {
  return !state.requirements && !state.architecture;
}

/**
 * Checks if a stage has already completed.
 * 
 * @param state - The state to check
 * @param stageName - The stage name to check
 * @returns True if the stage has completed
 */
export function isStageCompleted(
  state: AgentState,
  stageName: AgentState["currentStage"]
): boolean {
  if (!stageName) return false;
  return state.completedStages.includes(stageName);
}

/**
 * Generates a unique session ID.
 * 
 * @returns A unique session identifier
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validates that a state object has the required structure.
 * 
 * @param state - The state to validate
 * @returns True if valid, false otherwise
 */
export function isValidState(state: unknown): state is AgentState {
  if (!state || typeof state !== "object") return false;
  
  const s = state as Partial<AgentState>;
  
  return (
    typeof s.sessionId === "string" &&
    typeof s.approvalStatus === "string" &&
    Array.isArray(s.completedStages) &&
    Array.isArray(s.errors) &&
    typeof s.reasoning === "object" &&
    typeof s.metadata === "object" &&
    typeof s.timestamps === "object"
  );
}
