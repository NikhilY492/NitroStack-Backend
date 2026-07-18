# Type Architecture Overview

## Type Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         AgentState                               │
│  The central data structure flowing through all stages           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  Requirements   │  │  ArchitectureSet │  │ SessionPricing │ │
│  │                 │  │                  │  │                │ │
│  │ - description   │  │ - candidates[]   │  │ - [candidateId]│ │
│  │ - expectedUsers │  │ - recommendedId  │  │   - monthlyCost│ │
│  │ - monthlyBudget │  │                  │  │   - breakdown  │ │
│  │ - slaTarget     │  │                  │  │                │ │
│  │ - environment   │  │                  │  │                │ │
│  │ - classification│  │                  │  │                │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ PolicyResults   │  │ SessionReasoning │  │ ApprovalStatus │ │
│  │                 │  │                  │  │                │ │
│  │ - [candidateId] │  │ - planner        │  │ - pending      │ │
│  │   - checks[]    │  │ - requirements   │  │ - approved     │ │
│  │                 │  │ - architect      │  │ - rejected     │ │
│  │                 │  │ - cost           │  │                │ │
│  │                 │  │ - policy         │  │                │ │
│  │                 │  │ - coordinator    │  │                │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ terraform: string                                            ││
│  │ currentStage: StageName                                      ││
│  │ completedStages: StageName[]                                 ││
│  │ errors: StateError[]                                         ││
│  │ metadata: StateMetadata                                      ││
│  │ timestamps: StateTimestamps                                  ││
│  │ toolCalls: ToolCallRecord[]                                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Stage Data Flow

```
┌──────────┐
│ Planner  │
└────┬─────┘
     │ produces: PlannerReasoning
     ▼
┌─────────────────────┐
│ Requirements        │
│ Extractor           │
└────┬────────────────┘
     │ produces: Requirements + RequirementsReasoning
     ▼
┌─────────────────────┐
│ Architecture        │
│ Designer            │
└────┬────────────────┘
     │ produces: ArchitectureSet + ArchitectureReasoning
     ▼
┌─────────────────────┐
│ Cost Analyst        │
└────┬────────────────┘
     │ produces: SessionPricing + CostReasoning
     ▼
┌─────────────────────┐
│ Policy Validator    │
└────┬────────────────┘
     │ produces: PolicyResults + PolicyReasoning
     ▼
┌─────────────────────┐
│ Coordinator         │
└────┬────────────────┘
     │ produces: CoordinatorReasoning + terraform
     ▼
┌─────────────────────┐
│ Final State         │
│ (awaiting approval) │
└─────────────────────┘
```

## Candidate Architecture Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    CandidateArchitecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Created by Architecture Designer:                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ id: "cand-a"                                            │     │
│  │ label: "ECS + PostgreSQL"                               │     │
│  │ compute: "ecs_fargate"                                  │     │
│  │ database: "postgresql"                                  │     │
│  │ cache: false                                            │     │
│  │ scaling: "auto"                                         │     │
│  │ instanceType: "t4g.medium"                              │     │
│  └────────────────────────────────────────────────────────┘     │
│                          │                                        │
│                          ▼                                        │
│  Enhanced by Cost Analyst:                                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ pricing: {                                              │     │
│  │   monthlyCost: 29000,                                   │     │
│  │   breakdown: {                                          │     │
│  │     compute: 18000,                                     │     │
│  │     storage: 6000,                                      │     │
│  │     networkEgress: 3000,                                │     │
│  │     other: 2000                                         │     │
│  │   },                                                    │     │
│  │   currency: "INR"                                       │     │
│  │ }                                                       │     │
│  └────────────────────────────────────────────────────────┘     │
│                          │                                        │
│                          ▼                                        │
│  Enhanced by Policy Validator:                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ policyChecks: [                                         │     │
│  │   { policyId: "budget-dev", label: "...", passed: true }│     │
│  │   { policyId: "arm-pref", label: "...", passed: true }  │     │
│  │ ]                                                       │     │
│  └────────────────────────────────────────────────────────┘     │
│                          │                                        │
│                          ▼                                        │
│  Enhanced by Coordinator (if NOT recommended):                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ rejectionReason: "Higher cost with minimal benefit"     │     │
│  └────────────────────────────────────────────────────────┘     │
│                          │                                        │
│                          ▼                                        │
│  Enhanced by Coordinator (if IS recommended):                    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ terraform: "resource \"aws_ecs_service\" \"app\" { ... }"│     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Tool Contract Pattern

```
┌────────────────────────────────────────────────────────┐
│                    Tool Call Flow                       │
├────────────────────────────────────────────────────────┤
│                                                          │
│  1. Stage creates ToolRequest<Params>                   │
│     ┌──────────────────────────────────────┐           │
│     │ tool: "get_cloud_pricing"             │           │
│     │ parameters: {                         │           │
│     │   resourceType: "compute",            │           │
│     │   instanceType: "t4g.medium"          │           │
│     │ }                                     │           │
│     └──────────────────────────────────────┘           │
│                      │                                   │
│                      ▼                                   │
│  2. Tool executes and returns ToolResponse<Data>        │
│     ┌──────────────────────────────────────┐           │
│     │ tool: "get_cloud_pricing"             │           │
│     │ status: "success"                     │           │
│     │ data: {                               │           │
│     │   monthlyCost: 1850,                  │           │
│     │   unit: "INR/month"                   │           │
│     │ }                                     │           │
│     └──────────────────────────────────────┘           │
│                      │                                   │
│                      ▼                                   │
│  3. Stage receives ToolResult<Data>                     │
│     Success variant:                                    │
│     ┌──────────────────────────────────────┐           │
│     │ success: true                         │           │
│     │ data: { monthlyCost: 1850, ... }      │           │
│     └──────────────────────────────────────┘           │
│     OR Failure variant:                                 │
│     ┌──────────────────────────────────────┐           │
│     │ success: false                        │           │
│     │ error: {                              │           │
│     │   code: "UNKNOWN_INSTANCE_TYPE",      │           │
│     │   message: "...",                     │           │
│     │   retryable: false                    │           │
│     │ }                                     │           │
│     └──────────────────────────────────────┘           │
│                      │                                   │
│                      ▼                                   │
│  4. ToolCallRecord added to state.toolCalls[]           │
│     ┌──────────────────────────────────────┐           │
│     │ tool: "get_cloud_pricing"             │           │
│     │ calledAt: "2026-07-18T10:00:00Z"      │           │
│     │ calledBy: "cost"                      │           │
│     │ success: true                         │           │
│     │ executionTimeMs: 45                   │           │
│     └──────────────────────────────────────┘           │
│                                                          │
└────────────────────────────────────────────────────────┘
```

## Reasoning Accumulation

```
┌─────────────────────────────────────────────────────────┐
│              SessionReasoning                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Stage 1: Planner                                        │
│  ┌───────────────────────────────────────────────┐      │
│  │ planner: {                                     │      │
│  │   canProceed: true,                            │      │
│  │   nextAction: "extract_requirements",          │      │
│  │   observations: ["Sufficient info provided"],  │      │
│  │   isResumedSession: false                      │      │
│  │ }                                              │      │
│  └───────────────────────────────────────────────┘      │
│                          │                               │
│                          ▼                               │
│  Stage 2: Requirements Extractor                         │
│  ┌───────────────────────────────────────────────┐      │
│  │ requirements: {                                │      │
│  │   extractedFields: ["expectedUsers", "budget"],│      │
│  │   inferredFields: ["slaTarget"],               │      │
│  │   missingFields: [],                           │      │
│  │   classificationRationale: "CPU-intensive...", │      │
│  │   resourceEstimationPerformed: true            │      │
│  │ }                                              │      │
│  └───────────────────────────────────────────────┘      │
│                          │                               │
│                          ▼                               │
│  Stage 3: Architecture Designer                          │
│  ┌───────────────────────────────────────────────┐      │
│  │ architect: {                                   │      │
│  │   decisions: ["ECS selected for containers"],  │      │
│  │   rejectedOptions: [                           │      │
│  │     { option: "Lambda", reason: "..." }        │      │
│  │   ],                                           │      │
│  │   consideredExistingInfra: false,              │      │
│  │   candidatesGenerated: 3                       │      │
│  │ }                                              │      │
│  └───────────────────────────────────────────────┘      │
│                          │                               │
│                          ▼                               │
│  Stage 4: Cost Analyst                                   │
│  ┌───────────────────────────────────────────────┐      │
│  │ cost: {                                        │      │
│  │   pricingLookupsPerformed: 12,                 │      │
│  │   pricingFailures: [],                         │      │
│  │   observations: ["Candidate A cheapest"]       │      │
│  │ }                                              │      │
│  └───────────────────────────────────────────────┘      │
│                          │                               │
│                          ▼                               │
│  Stage 5: Policy Validator                               │
│  ┌───────────────────────────────────────────────┐      │
│  │ policy: {                                      │      │
│  │   rulesEvaluated: 5,                           │      │
│  │   summary: ["All candidates passed budget"],   │      │
│  │   criticalFailures: []                         │      │
│  │ }                                              │      │
│  └───────────────────────────────────────────────┘      │
│                          │                               │
│                          ▼                               │
│  Stage 6: Coordinator                                    │
│  ┌───────────────────────────────────────────────┐      │
│  │ coordinator: {                                 │      │
│  │   recommendedCandidateId: "cand-a",            │      │
│  │   summary: ["ECS selected for..."],            │      │
│  │   confidence: 0.85,                            │      │
│  │   tradeoffAnalysis: { ... },                   │      │
│  │   rejections: [ ... ]                          │      │
│  │ }                                              │      │
│  └───────────────────────────────────────────────┘      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Common Interface Composition

```
┌────────────────────────────────────────┐
│         Common Interfaces               │
├────────────────────────────────────────┤
│                                          │
│  Identifiable          Timestamped       │
│  ┌───────────┐        ┌──────────────┐  │
│  │ - id      │        │ - createdAt  │  │
│  └───────────┘        │ - updatedAt  │  │
│                       └──────────────┘  │
│         │                    │           │
│         └────────┬───────────┘           │
│                  ▼                       │
│  MetadataCarrier        Entity           │
│  ┌────────────────┐    ┌──────────────┐ │
│  │ - metadata     │    │ = Identifiable│ │
│  └────────────────┘    │ + Timestamped │ │
│                        │ + Metadata    │ │
│                        └──────────────┘ │
│                                          │
│  Versioned             Labeled           │
│  ┌────────────┐        ┌──────────────┐ │
│  │ - version  │        │ - label      │ │
│  └────────────┘        │ - description│ │
│                        └──────────────┘ │
│                                          │
│  Outcome                                 │
│  ┌────────────────────┐                 │
│  │ - success: boolean │                 │
│  │ - error?: string   │                 │
│  └────────────────────┘                 │
│                                          │
└────────────────────────────────────────┘
```

## Type Safety Guarantees

### Discriminated Unions
```typescript
// ToolResult is type-safe
type ToolResult<T> = ToolSuccess<T> | ToolFailure

// TypeScript knows which fields exist
if (result.success) {
  result.data    // ✅ Available
  result.error   // ❌ Type error
} else {
  result.data    // ❌ Type error
  result.error   // ✅ Available
}
```

### String Literal Unions
```typescript
// Only valid values allowed
type StageName = "planner" | "requirements" | "architect" 
               | "cost" | "policy" | "coordinator"

type ApprovalStatus = "pending" | "approved" | "rejected"

type ComputeType = "ec2" | "ecs_fargate" | "lambda" | "eks"
```

### Readonly Immutability
```typescript
// All state fields are readonly
const state: AgentState = createEmptyState();
state.sessionId = "new-id";  // ❌ Type error - readonly

// Must create new state
const newState = { ...state, terraform: "..." };  // ✅
```

---

**Key Insight**: The type system enforces the architecture document's contracts at compile time, making it impossible to pass invalid data between stages.
