/**
 * Reasoning types for all six logical stages of the Agent Runtime.
 * 
 * Each stage produces structured reasoning output that is preserved in
 * the shared agent state for transparency and debugging.
 * 
 * The Coordinator's output is special - it represents the final recommendation
 * and is used to construct the InfrastructureAnalysis payload.
 */

/**
 * Reasoning output from the Planner stage.
 * Records high-level triage decisions.
 */
export interface PlannerReasoning {
  /**
   * Whether the prompt contains enough information to proceed.
   */
  readonly canProceed: boolean;

  /**
   * If canProceed is false, the clarifying question to ask the user.
   */
  readonly clarifyingQuestion?: string;

  /**
   * What the Planner determined should happen next.
   */
  readonly nextAction: "extract_requirements" | "ask_user" | "resume_session";

  /**
   * High-level observations about the prompt.
   */
  readonly observations: readonly string[];

  /**
   * Whether this is a resumed session (existing state was found).
   */
  readonly isResumedSession: boolean;
}

/**
 * Reasoning output from the Requirements Extractor stage.
 */
export interface RequirementsReasoning {
  /**
   * Fields that were successfully extracted from the prompt.
   */
  readonly extractedFields: readonly string[];

  /**
   * Fields that could not be extracted and were inferred or defaulted.
   */
  readonly inferredFields: readonly string[];

  /**
   * Fields that are missing and could not be inferred.
   */
  readonly missingFields: readonly string[];

  /**
   * Workload classification rationale.
   */
  readonly classificationRationale: string;

  /**
   * Whether estimate_resource_requirements was called.
   */
  readonly resourceEstimationPerformed: boolean;
}

/**
 * Reasoning output from the Architecture Designer stage.
 */
export interface ArchitectureReasoning {
  /**
   * High-level architectural decisions and rationale.
   */
  readonly decisions: readonly string[];

  /**
   * Options that were considered and rejected before generating candidates.
   */
  readonly rejectedOptions: readonly RejectedOption[];

  /**
   * Whether existing infrastructure was read and considered.
   */
  readonly consideredExistingInfra: boolean;

  /**
   * Number of candidates generated.
   */
  readonly candidatesGenerated: number;

  /**
   * Any constraints that were relaxed to generate enough distinct candidates.
   */
  readonly relaxedConstraints?: readonly string[];
}

/**
 * Represents an option that was rejected during architecture design.
 */
export interface RejectedOption {
  /**
   * The option that was rejected (e.g., "Lambda", "Kubernetes").
   */
  readonly option: string;

  /**
   * Why it was rejected.
   */
  readonly reason: string;
}

/**
 * Reasoning output from the Cost Analyst stage.
 */
export interface CostReasoning {
  /**
   * Summary of pricing lookups performed.
   */
  readonly pricingLookupsPerformed: number;

  /**
   * Any pricing lookups that failed and how they were handled.
   */
  readonly pricingFailures?: readonly PricingFailure[];

  /**
   * Cost comparison observations.
   */
  readonly observations: readonly string[];
}

/**
 * Represents a pricing lookup that failed.
 */
export interface PricingFailure {
  /**
   * Candidate ID affected.
   */
  readonly candidateId: string;

  /**
   * Resource that couldn't be priced.
   */
  readonly resource: string;

  /**
   * How the failure was handled.
   */
  readonly fallbackStrategy: string;
}

/**
 * Reasoning output from the Policy Validator stage.
 */
export interface PolicyReasoning {
  /**
   * Number of policy rules evaluated.
   */
  readonly rulesEvaluated: number;

  /**
   * Summary of policy validation results.
   */
  readonly summary: readonly string[];

  /**
   * Candidates that failed critical policies.
   */
  readonly criticalFailures?: readonly string[];
}

/**
 * Reasoning output from the Coordinator stage.
 * This is the most important reasoning output as it represents the final decision.
 */
export interface CoordinatorReasoning {
  /**
   * The recommended candidate ID.
   */
  readonly recommendedCandidateId: string;

  /**
   * Human-readable summary bullets explaining the recommendation.
   */
  readonly summary: readonly string[];

  /**
   * Confidence score (0.0 to 1.0).
   */
  readonly confidence: number;

  /**
   * Tradeoff analysis performed across all six factors.
   */
  readonly tradeoffAnalysis: TradeoffAnalysis;

  /**
   * Rejection reasons for non-recommended candidates.
   */
  readonly rejections: readonly CandidateRejection[];
}

/**
 * Analysis of tradeoffs across the six decision factors.
 */
export interface TradeoffAnalysis {
  /**
   * Cost factor evaluation.
   */
  readonly cost: string;

  /**
   * Performance factor evaluation.
   */
  readonly performance: string;

  /**
   * Reliability factor evaluation.
   */
  readonly reliability: string;

  /**
   * Scalability factor evaluation.
   */
  readonly scalability: string;

  /**
   * Policy compliance factor evaluation.
   */
  readonly policyCompliance: string;

  /**
   * Operational complexity factor evaluation.
   */
  readonly operationalComplexity: string;
}

/**
 * Rejection reason for a non-recommended candidate.
 */
export interface CandidateRejection {
  /**
   * Candidate ID that was rejected.
   */
  readonly candidateId: string;

  /**
   * Human-readable reason why it wasn't recommended.
   */
  readonly reason: string;

  /**
   * Which factor(s) tipped the decision against it.
   */
  readonly primaryFactors: readonly string[];
}

/**
 * Complete reasoning record for an entire session.
 * Maps stage name to its reasoning output.
 */
export interface SessionReasoning {
  readonly planner?: PlannerReasoning;
  readonly requirements?: RequirementsReasoning;
  readonly architect?: ArchitectureReasoning;
  readonly cost?: CostReasoning;
  readonly policy?: PolicyReasoning;
  readonly coordinator?: CoordinatorReasoning;
}

/**
 * Final output from the Coordinator stage.
 * This is used to construct the InfrastructureAnalysis payload for the dashboard.
 */
export interface CoordinatorOutput {
  /**
   * The recommended candidate architecture.
   */
  readonly recommendedCandidate: string;

  /**
   * All candidates with rejection reasons attached to non-recommended ones.
   */
  readonly allCandidates: readonly string[];

  /**
   * The Coordinator's reasoning.
   */
  readonly reasoning: CoordinatorReasoning;

  /**
   * Generated Terraform HCL for the recommended candidate.
   */
  readonly terraform: string;
}
