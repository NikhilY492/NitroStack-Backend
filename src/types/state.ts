// ─── Shared Types for the Shift-Left FinOps Agent Runtime ───────────────────
// These are the TypeScript representations of Section 6 (Shared Agent State)
// and Section 18 (Dashboard Data Contract) from the spec.

// ─── Requirements ────────────────────────────────────────────────────────────

export type WorkloadClassification =
  | 'cpu-intensive'
  | 'io-bound'
  | 'batch'
  | 'event-driven'
  | 'production'
  | 'medium-scale'
  | 'small-scale'
  | 'large-scale';

export type Environment = 'prod' | 'dev' | 'staging';

export interface Requirements {
  description: string;
  expectedUsers: number;
  monthlyBudget: number;
  slaTarget: string;
  environment: Environment;
  classification: WorkloadClassification[];
}

// ─── Resource Estimates ───────────────────────────────────────────────────────

export interface ResourceEstimate {
  cpu: string;
  memory: string;
  storageGrowth: string;
  expectedRps: number;
}

// ─── Architecture Candidates ─────────────────────────────────────────────────

export type ComputeOption = 'ec2' | 'ecs_fargate' | 'lambda';
export type DatabaseOption = 'postgresql' | 'dynamodb';
export type ScalingOption = 'auto' | 'fixed';
export type InstanceType = 't3.micro' | 't3.medium' | 't3.large' | 't4g.medium' | 'm5.large';

export interface ArchitectureCandidate {
  id: string;
  label: string;
  compute: ComputeOption;
  database: DatabaseOption;
  cache: boolean;
  scaling: ScalingOption;
  instanceType: InstanceType;
  description?: string;
  monthlyCost?: number; // Filled in by Cost Analyst
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface PricingBreakdown {
  monthlyCost: number;
  compute: number;
  storage: number;
  networkEgress: number;
  cache: number;
  other: number;
}

export type PricingMap = Record<string, PricingBreakdown>;

// ─── Policy ──────────────────────────────────────────────────────────────────

export type PolicySeverity = 'error' | 'warning' | 'info';

export interface PolicyRule {
  id: string;
  label: string;
  description: string;
  appliesTo: Environment[];
  severity?: PolicySeverity;
}

export interface PolicyCheck {
  ruleId: string;
  label: string;
  passed: boolean;
  severity?: PolicySeverity;
  reason?: string;
}

export type PolicyResultsMap = Record<string, PolicyCheck[]>;

// ─── Architecture Scores (from compare_architectures) ────────────────────────

export interface CandidateScore {
  candidateId: string;
  withinBudget: boolean;
  meetsSla: boolean;
  policyPassRate: number;
  relativeCostRank: number; // 1 = cheapest
}

// ─── Terraform ───────────────────────────────────────────────────────────────

export interface TerraformOutput {
  hcl: string;
  candidateId: string;
}

// ─── Reasoning ───────────────────────────────────────────────────────────────

export interface ReasoningState {
  planner: string[];
  requirements: string[];
  architect: string[];
  cost: string[];
  policy: string[];
  coordinator: string[];
  summary?: string;
  confidence?: number; // 0–1
}

// ─── Approval ────────────────────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// ─── Shared Agent State (Section 6) ──────────────────────────────────────────

export interface AgentState {
  sessionId: string;
  requirements: Requirements | null;
  architecture: {
    candidates: ArchitectureCandidate[];
    recommended: string | null; // candidateId
  };
  pricing: PricingMap;
  policyResults: PolicyResultsMap;
  reasoning: ReasoningState;
  approvalStatus: ApprovalStatus;
  terraform: TerraformOutput | null;
}

// ─── Infrastructure Analysis (Section 18 — Dashboard Data Contract) ──────────

export interface RejectedCandidate {
  candidate: ArchitectureCandidate;
  rejectionReason: string;
  pricing?: PricingBreakdown;
  policyResults?: PolicyCheck[];
}

export interface InfrastructureAnalysis {
  // Server-assigned fields (set by present_analysis)
  id: string;
  timestamp: string;
  status: ApprovalStatus;

  // Agent-provided fields
  sessionId: string;
  requirements: Requirements;
  recommended: {
    candidate: ArchitectureCandidate;
    pricing: PricingBreakdown;
    policyResults: PolicyCheck[];
    scores: CandidateScore;
  };
  alternatives: RejectedCandidate[];
  reasoning: {
    summary: string;
    bullets: string[];
    confidence: number;
  };
  terraform: {
    hcl: string;
  };
}

// ─── Tool Input/Output Shapes (Section 12) ───────────────────────────────────

export interface ReadExistingInfraInput {
  workingDir: string;
}

export interface TerraformResource {
  type: string;
  name: string;
  attributes: Record<string, unknown>;
}

export interface ReadExistingInfraOutput {
  resources: TerraformResource[];
}

export interface GetCloudPricingInput {
  resourceType: 'compute' | 'database' | 'cache';
  instanceType: string;
}

export interface GetCloudPricingOutput {
  monthlyCost: number;
  unit: string;
}

export interface EstimateResourceInput {
  workloadDescription: string;
  expectedUsers: number;
}

export interface GenerateCandidatesInput {
  requirements: Requirements;
  constraints: {
    monthlyBudget: number;
    slaTarget: string;
    environment: Environment;
  };
}

export interface CompareArchitecturesInput {
  candidates: ArchitectureCandidate[];
  policyResults: PolicyResultsMap;
  constraints: {
    monthlyBudget: number;
    slaTarget: string;
  };
}

export interface CompareArchitecturesOutput {
  scores: CandidateScore[];
}

export interface GenerateTerraformInput {
  candidate: ArchitectureCandidate;
}

export interface SubmitApprovalInput {
  analysisId: string;
  decision: 'approved' | 'rejected';
}

export interface CheckApprovalInput {
  analysisId: string;
}

export interface WriteApprovedInput {
  analysisId: string;
}
