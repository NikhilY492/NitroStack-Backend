# Shift-Left FinOps: Autonomous Infrastructure Planning Agent

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

```bash
# Install dependencies
npm install

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
