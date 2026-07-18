# Shift-Left FinOps: Autonomous Infrastructure Planning Agent

<<<<<<< HEAD
> *An agent that reasons through cost, performance, reliability, and compliance tradeoffs — and only writes Terraform once a human has seen and approved the thinking behind it.*

---

## Quick Start
=======
An agent that reasons through cost, performance, reliability, and compliance tradeoffs — and only writes Terraform once a human has seen and approved the thinking behind it.

## Project Status: Phase 1 Complete ✅

### Phase 1: Shared Contract Layer

This phase establishes the foundational type system for the entire Agent Runtime. It contains **zero runtime logic** and serves as the single source of truth for all data structures used throughout the project.

## Structure

```
src/
├── types/
│   ├── requirements.ts      # Requirements extraction types
│   ├── architecture.ts       # Candidate architecture types
│   ├── pricing.ts           # Pricing and cost breakdown types
│   ├── policy.ts            # Policy validation types
│   ├── reasoning.ts         # Reasoning output types for all stages
│   ├── approval.ts          # Approval flow types
│   ├── stage.ts             # Stage execution types
│   ├── tool.ts              # MCP tool contract types
│   └── index.ts             # Barrel export
│
schemas/
├── state.ts                 # AgentState definition
├── state.schema.ts          # State utility functions
└── interfaces.ts            # Common reusable interfaces
```

## Key Types

### AgentState
The central data structure that flows through all six reasoning stages:
- `sessionId` - Unique session identifier
- `requirements` - Structured user requirements
- `architecture` - Candidate architectures
- `pricing` - Cost breakdowns
- `policyResults` - Policy validation results
- `reasoning` - Accumulated reasoning from all stages
- `approvalStatus` - Current approval state
- `terraform` - Generated HCL
- `currentStage` - Stage currently executing
- `completedStages` - Stages that have finished
- `errors` - Error history
- `metadata` - Session metadata
- `timestamps` - Key lifecycle timestamps

### Six Reasoning Stages
Each stage has its own reasoning output type:
1. **Planner** - Entry point, triages prompts
2. **Requirements Extractor** - Extracts structured requirements
3. **Architecture Designer** - Generates candidate architectures
4. **Cost Analyst** - Prices each candidate
5. **Policy Validator** - Validates against company policy
6. **Coordinator** - Chooses recommendation, generates final output

### Tool Contracts
Generic, reusable contracts for all MCP tools:
- `ToolRequest<T>` - Base request structure
- `ToolResponse<T>` - Base response structure
- `ToolResult<T>` - Discriminated union for success/failure
- `ToolError` - Detailed error information

## Usage

```typescript
import {
  createEmptyState,
  createState,
  type AgentState,
  type Requirements,
  type CandidateArchitecture,
  type CoordinatorReasoning,
} from "./src";

// Create a new session
const state = createEmptyState();

// Or create with metadata
const customState = createState("session-123", {
  cloudProvider: "aws",
  region: "us-east-1",
});
```

## Design Principles

### ✅ What This Phase Includes
- Strongly-typed contracts for all data structures
- Pure utility functions for state manipulation
- Reusable interfaces for common patterns
- Complete JSDoc documentation
- Full TypeScript strict mode compliance

### ❌ What This Phase Explicitly Excludes
- No runtime orchestration
- No stage execution logic
- No AI/LLM integration
- No MCP tool implementations
- No backend logic
- No dashboard components
- No reasoning algorithms
- No state transitions or workflows

## Type Safety

All types are:
- **Immutable** - Using `readonly` modifiers
- **Strict** - No `any` types
- **Documented** - Comprehensive JSDoc comments
- **Extensible** - Metadata fields for future additions

## Building
>>>>>>> master

```bash
# Install dependencies
npm install

<<<<<<< HEAD
# Install widget dependencies
cd src/widgets && npm install && cd ../..

# Run the MCP server
npm run dev
```

Open the project in **NitroStudio** for hot-reload, tool testing, and widget preview.

---

## What This Is

This is a **NitroStack MCP server** that exposes 11 backend tools to an LLM-driven Agent Runtime. The LLM (Claude/Cursor) drives a 6-stage reasoning workflow that:

1. Classifies the workload from a plain-language description
2. Generates 3 candidate architectures from the MVP catalog
3. Prices each candidate (static INR pricing, no live API calls)
4. Validates each candidate against 5 company policy rules
5. Recommends the best option using a six-factor decision model
6. Presents the full analysis on a dashboard widget — **and pauses**
7. Writes Terraform **only** after a human approves

**Terraform is not the starting point and not the product. It's the final artifact of the reasoning process.**

---

## Architecture

```
Developer prompt
    │
    ▼
LLM (Claude / Cursor)
    │
    ▼
Agent Runtime (6 logical stages)
    │
    ├─ Planner              (triage, session detection)
    ├─ Requirements Extractor (structured extraction, classification)
    ├─ Architecture Designer  (candidate generation, pruning)
    ├─ Cost Analyst           (pricing per resource per candidate)
    ├─ Policy Validator       (compliance check per rule per candidate)
    └─ Coordinator            (six-factor decision, terraform, dashboard)
         │
         ▼
    MCP Tool Calls (only when reasoning decides they're needed)
         │
         ▼
    NitroStack MCP Server (this repo)
         │
         ├─ Backend tools (pure functions, no reasoning)
         ├─ Knowledge base (pricing.json, compute-catalog.json, policy.yaml)
         └─ @Widget('arch-dashboard') → React dashboard
```

---

## Project Structure

```
shift-left-finops/
├── knowledge/
│   ├── pricing.json           # Static AWS pricing (INR/month)
│   ├── compute-catalog.json   # MVP catalog + candidate templates
│   └── policy.yaml            # 5 compliance rules
├── sample-project/
│   └── main.tf                # Existing VPC (write_approved_changes appends here)
├── src/
│   ├── index.ts               # NitroStack server bootstrap
│   ├── app.module.ts          # Root module
│   ├── types/
│   │   └── state.ts           # Full TypeScript type system
│   ├── store/
│   │   └── pendingAnalyses.ts # In-memory approval store
│   ├── tools/                 # Pure function implementations (no reasoning)
│   │   ├── tfReader.ts        # read_existing_infrastructure
│   │   ├── policyReader.ts    # read_company_policies
│   │   ├── pricingLookup.ts   # get_cloud_pricing
│   │   ├── resourceEstimator.ts # estimate_resource_requirements
│   │   ├── candidateGenerator.ts # generate_candidate_architectures
│   │   ├── architectureComparer.ts # compare_architectures
│   │   ├── terraformGenerator.ts # generate_terraform
│   │   ├── analysisPresenter.ts  # present_analysis
│   │   ├── approvalHandler.ts    # submit_approval + check_approval_status
│   │   └── tfWriter.ts           # write_approved_changes
│   ├── modules/
│   │   └── infra/
│   │       ├── infra.tools.ts    # @Tool + @Widget decorations (NitroStack)
│   │       └── infra.module.ts
│   ├── agents/                # Prompt specifications for each reasoning stage
│   │   ├── planner.md
│   │   ├── requirements.md
│   │   ├── architect.md
│   │   ├── cost.md
│   │   ├── policy.md
│   │   └── coordinator.md
│   ├── schemas/
│   │   └── state.schema.json  # JSON Schema for AgentState
│   ├── contracts/
│   │   └── tool-contracts.md  # AI ↔ Backend contract
│   └── widgets/               # Next.js widget workspace
│       ├── package.json
│       ├── tsconfig.json
│       └── app/
│           ├── layout.tsx
│           ├── globals.css
│           └── arch-dashboard/
│               └── page.tsx   # The approval dashboard widget
├── package.json
├── tsconfig.json
├── nitro.config.json
└── .env
```

---

## MVP Scope (Hard Boundaries)

| Dimension | Allowed Values |
|---|---|
| Compute | EC2, ECS Fargate, Lambda |
| Database | PostgreSQL (RDS), DynamoDB |
| Cache | Redis — yes / no |
| Scaling | Auto, Fixed |
| Instance Types | t3.micro, t3.medium, t3.large, t4g.medium, m5.large |
| Region | us-east-1 only |
| Candidates per run | Exactly 3 |
| Pricing | Static JSON (no live API) |

---

## Demo Flow

1. Open NitroStudio and connect to this server
2. Send to the LLM: *"Build infrastructure for an image-processing backend serving 100,000 users, under ₹35,000/month with 99.9% availability."*
3. Watch the agent runtime work through the 6 stages
4. The `arch-dashboard` widget appears with:
   - Animated cost counter
   - 3 candidate cards (recommended + 2 rejected with reasons)
   - Donut chart cost breakdown
   - Policy compliance badges
   - AI reasoning bullets
   - Terraform diff viewer
5. Click **Approve** — Terraform is written to `sample-project/main.tf`

---

## Key Design Decisions

- **MCP is plumbing, not the brain.** All 11 tools are pure functions. Zero tradeoff logic lives in the backend.
- **No live pricing APIs.** Uses a static `pricing.json` knowledge base — removes network/API-key risk from the demo.
- **No separate dashboard process.** `@Widget('arch-dashboard')` attaches the React component directly to `present_analysis`'s output — NitroStudio renders it inline.
- **Approval is widget-native.** The Approve/Reject buttons call `submit_approval` via `callTool()` from `useWidgetSDK` — no Express bridge needed.
- **Idempotent writes.** `write_approved_changes` uses marker blocks (`# SHIFT-LEFT-FINOPS: managed block start/end`) so re-runs replace, not duplicate.

---

## Policy Rules (knowledge/policy.yaml)

| Rule | Applies To | Severity |
|---|---|---|
| `budget-prod` — Prod ≤ ₹50,000/mo | prod | error |
| `budget-dev` — Dev ≤ ₹10,000/mo | dev, staging | error |
| `arm-preferred` — Prefer t4g instances | all | warning |
| `no-lambda-cpu` — No Lambda for CPU-intensive | all | error |
| `multi-az-prod` — Must use auto-scaling in prod | prod | error |
=======
# Type check
npm run type-check

# Build
npm run build
```

## Next Phases

Phase 1 provides the contract layer. Future phases will implement:
- **Phase 2**: MCP Tool Contracts and Backend Scaffolding
- **Phase 3**: Agent Runtime and Stage Implementation
- **Phase 4**: Prompt Engineering and Claude Integration
- **Phase 5**: Dashboard and Approval Flow
- **Phase 6**: Integration and End-to-End Testing

## Architecture Document

This implementation strictly follows the architecture document (`master.md`), specifically:
- Section 5: Agent Runtime (six logical stages)
- Section 6: Shared Agent State
- Section 12: MCP Tools specification
- Section 14: Prompt Architecture

The architecture document is the single source of truth. No design decisions deviate from it.

## Contributing

When extending this contract layer:
1. Maintain immutability (`readonly`)
2. Add JSDoc comments to all exports
3. Follow existing naming conventions
4. Keep types pure - no runtime behavior
5. Update this README when adding new type categories

---

**Status**: Phase 1 Complete - Ready for Phase 2
>>>>>>> master
