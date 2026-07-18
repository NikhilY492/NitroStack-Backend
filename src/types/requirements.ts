/**
 * Structured user requirements extracted from the natural language prompt.
 * 
 * This represents the output of the Requirements Extractor stage and serves
 * as input to downstream reasoning stages (Architecture Designer, Cost Analyst, etc.).
 * 
 * All fields are designed to be additive - new fields can be added without
 * breaking existing code.
 */
export interface Requirements {
  /**
   * The original natural language description provided by the user.
   */
  readonly description: string;

  /**
   * Expected number of users the infrastructure should support.
   */
  readonly expectedUsers: number;

  /**
   * Monthly budget constraint in the user's currency (e.g., INR, USD).
   */
  readonly monthlyBudget: number;

  /**
   * Service Level Agreement target (e.g., "99.9%", "99.99%").
   */
  readonly slaTarget: string;

  /**
   * Target environment (e.g., "dev", "staging", "prod").
   */
  readonly environment: "dev" | "staging" | "prod";

  /**
   * Workload classification tags derived from the description.
   * Examples: ["cpu-intensive", "io-bound", "batch", "real-time", "production", "medium-scale"]
   */
  readonly workloadClassification: readonly string[];

  /**
   * Additional constraints extracted from the prompt or inferred.
   */
  readonly constraints?: RequirementConstraints;

  /**
   * Extensible metadata field for additional context.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Additional constraints that may influence architecture decisions.
 */
export interface RequirementConstraints {
  /**
   * Cloud provider constraint (e.g., "aws", "azure", "gcp").
   */
  readonly cloudProvider?: string;

  /**
   * Region constraint (e.g., "us-east-1", "eu-west-1").
   */
  readonly region?: string;

  /**
   * Compliance requirements (e.g., ["HIPAA", "SOC2", "GDPR"]).
   */
  readonly compliance?: readonly string[];

  /**
   * Performance constraints.
   */
  readonly performance?: {
    readonly maxLatencyMs?: number;
    readonly minThroughputRps?: number;
  };

  /**
   * Extensible field for custom constraints.
   */
  readonly custom?: Record<string, unknown>;
}

/**
 * Resource requirements estimated for the workload.
 * Output of the estimate_resource_requirements tool.
 */
export interface ResourceRequirements {
  /**
   * CPU requirement (e.g., "2 vCPU", "4 cores").
   */
  readonly cpu: string;

  /**
   * Memory requirement (e.g., "4GB", "8GB").
   */
  readonly memory: string;

  /**
   * Expected storage growth rate (e.g., "50GB/month").
   */
  readonly storageGrowth: string;

  /**
   * Expected requests per second.
   */
  readonly expectedRps: number;

  /**
   * Additional capacity metrics.
   */
  readonly metadata?: Record<string, unknown>;
}
