/**
 * Pricing-related types for the Cost Analyst stage.
 * 
 * These types support the get_cloud_pricing tool and the cost breakdown
 * computation performed by the Cost Analyst.
 */

/**
 * Resource type for pricing queries.
 */
export type ResourceType = "compute" | "database" | "cache" | "storage" | "network";

/**
 * Request structure for cloud pricing lookups.
 */
export interface PricingRequest {
  /**
   * Type of resource to price.
   */
  readonly resourceType: ResourceType;

  /**
   * Specific instance or service type (e.g., "t4g.medium", "db.t3.large").
   */
  readonly instanceType: string;

  /**
   * Optional region for region-specific pricing.
   */
  readonly region?: string;
}

/**
 * Response from cloud pricing lookup.
 */
export interface PricingResponse {
  /**
   * Monthly cost in the specified currency.
   */
  readonly monthlyCost: number;

  /**
   * Currency unit (e.g., "INR", "USD").
   */
  readonly unit: string;

  /**
   * Optional breakdown for composite resources.
   */
  readonly breakdown?: Record<string, number>;
}

/**
 * Pricing information for all candidates in a session.
 * Maps candidate ID to its pricing breakdown.
 */
export interface SessionPricing {
  /**
   * Pricing data per candidate, keyed by candidate ID.
   */
  readonly [candidateId: string]: CandidatePricingBreakdown;
}

/**
 * Complete pricing breakdown for a single candidate.
 */
export interface CandidatePricingBreakdown {
  /**
   * Total monthly cost.
   */
  readonly monthlyCost: number;

  /**
   * Compute costs.
   */
  readonly compute: number;

  /**
   * Storage costs.
   */
  readonly storage: number;

  /**
   * Network egress costs.
   */
  readonly networkEgress: number;

  /**
   * Other infrastructure costs.
   */
  readonly other: number;

  /**
   * Currency unit.
   */
  readonly currency?: string;
}

/**
 * Pricing comparison between candidates.
 * Used by the Coordinator to evaluate cost tradeoffs.
 */
export interface PricingComparison {
  /**
   * Lowest monthly cost among all candidates.
   */
  readonly lowestCost: number;

  /**
   * Highest monthly cost among all candidates.
   */
  readonly highestCost: number;

  /**
   * Candidate IDs ranked by cost (cheapest first).
   */
  readonly costRanking: readonly string[];

  /**
   * Number of candidates within budget.
   */
  readonly withinBudgetCount: number;
}
