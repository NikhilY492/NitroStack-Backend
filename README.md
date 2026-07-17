# Shift-Left FinOps: Autonomous Infrastructure Planning Agent

> *An agent that reasons through cost, performance, reliability, and compliance tradeoffs — and only writes Terraform once a human has seen and approved the thinking behind it.*

---

## Quick Start

```bash
# Install dependencies
npm install

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
