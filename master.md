# Shift-Left FinOps: Autonomous Infrastructure Planning Agent

**Tagline:** An agent that reasons through cost, performance, reliability, and compliance tradeoffs — and only writes Terraform once a human has seen and approved the thinking behind it.

**Team size:** 4
**Format:** Hackathon build (~14 hours)
**Stack:** LLM (Claude/Cursor) driving an **Agent Runtime** reasoning workflow + NitroStack (TypeScript MCP server framework, used purely to *expose* backend tools) + `@nitrostack/widgets` (React UI widgets attached to tool outputs) + Terraform + static pricing/compliance knowledge base

---

## Table of Contents

1. [Vision](#1-vision)
2. [Problem Statement](#2-problem-statement)
3. [Story](#3-story)
4. [What Makes This an Agent](#4-what-makes-this-an-agent)
5. [Agent Runtime — The AI Layer](#5-agent-runtime--the-ai-layer)
6. [Shared Agent State](#6-shared-agent-state)
7. [Agent Reasoning Workflow](#7-agent-reasoning-workflow)
8. [Decision-Making Model](#8-decision-making-model)
9. [Hackathon MVP Scope](#9-hackathon-mvp-scope)
10. [System Architecture](#10-system-architecture)
11. [Data Flow — Step by Step](#11-data-flow--step-by-step)
12. [MCP Tools — Full Specification](#12-mcp-tools--full-specification)
13. [AI ↔ Backend Contract](#13-ai--backend-contract)
14. [Prompt Architecture](#14-prompt-architecture)
15. [Tech Stack](#15-tech-stack)
16. [Repo Structure](#16-repo-structure)
17. [Memory & State Lifecycle](#17-memory--state-lifecycle)
18. [Dashboard Data Contract (Frontend Bridge)](#18-dashboard-data-contract-frontend-bridge)
19. [Frontend Design Spec](#19-frontend-design-spec)
20. [Team Division of Labor](#20-team-division-of-labor)
21. [Build Timeline (Hackathon)](#21-build-timeline-hackathon)
22. [Demo Script](#22-demo-script)
23. [Error Handling](#23-error-handling)
24. [Stretch Goals](#24-stretch-goals)
25. [Risks & Fallbacks](#25-risks--fallbacks)

---

## 1. Vision

Today, developers describe what they want to build, but they're still responsible for figuring out *how* to build it on the cloud — EC2 vs ECS vs Lambda, Postgres vs DynamoDB, Redis or not, Spot vs On-Demand, ARM vs x86. That requires cloud expertise, cost estimation, and compliance knowledge most developers don't have time to gather mid-task.

This project turns the AI assistant into an **infrastructure architect**, not a code generator. Given a plain-language description of a workload and its constraints (budget, SLA, environment), an **agent runtime** — a structured reasoning workflow the LLM executes — works through the tradeoffs, generates multiple candidate architectures, prices each one, checks each against company policy, and only *then* proposes Terraform — which a human must review and approve on a dashboard before it's written to disk.

**Terraform is not the starting point, and it isn't the product either. It's the final artifact of a reasoning process.** The thing we are actually building is that reasoning process — the agent runtime. MCP is the plumbing that lets it read files, look up prices, and check policy; it is not where the intelligence lives.

---

## 2. Problem Statement

Current AI coding assistants generate infrastructure by making educated guesses. They rarely account for actual workload shape, budget, organizational policy, scalability needs, reliability targets, or real cloud pricing. The result: developers over-provision, violate policy, blow budgets, or burn multiple review cycles with DevOps before something ships.

This system moves those decisions earlier in the development lifecycle — shifting cost and compliance left, into the design conversation itself, instead of catching problems at PR review or on the monthly bill.

---

## 3. Story

**Without the agent:** A developer is asked to build an image-processing service — 100,000 users, ₹35,000/month budget, 99.9% availability, AWS, production. They have to independently decide between Lambda/ECS/Kubernetes, pick a database, decide on caching, size instances, and estimate cost — usually by searching docs and pricing pages — before writing any Terraform. DevOps later rejects the PR for exceeding budget and violating infra guidelines.

**With the agent:** The developer writes one sentence: *"Build infrastructure for an image-processing backend serving 100,000 users, under ₹35,000/month with 99.9% availability."* The **agent runtime** reasons through workload type, compute options, resource sizing, and policy constraints; calls MCP tools only when it actually needs pricing, policy, or existing-infrastructure data; generates 2–3 candidate architectures; picks and justifies the best one; and pushes the full comparison to a dashboard. The developer reviews the reasoning, the alternatives, and the cost breakdown, then approves. Terraform is written automatically.

---

## 4. What Makes This an Agent

The goal is not *"generate Terraform."* The goal is:

> Design infrastructure that satisfies budget, reliability, performance, scalability, and organizational policy — while minimizing monthly cloud cost.

It's worth being explicit about what this project *isn't*, because it's the most common misreading of the architecture:

- **This is not a Terraform generator.** Terraform is emitted once, at the very end, for exactly one already-chosen candidate.
- **This is not an MCP server.** NitroStack is a delivery mechanism for backend functionality. It has no opinions about workloads, budgets, or tradeoffs.
- **This is an autonomous Infrastructure Planning Agent.** The reasoning — classifying the workload, weighing compute options, generating and comparing candidates, deciding what's "good enough" — happens in the **Agent Runtime** (Section 5), driven by the LLM. MCP tools are called *by* that reasoning, on demand, never the other way around.

A common but incorrect mental model of this system is:

```
User → LLM → MCP → Tools
```

This flattens the entire reasoning process into a single hop and makes MCP look like the brain of the system. It isn't. The correct model is:

```
User
  │
  ▼
LLM (Claude / Cursor)
  │
  ▼
Agent Runtime  (reasoning workflow — see Section 5)
  │
  ├─ Planner
  ├─ Requirements Extraction
  ├─ Architecture Design
  ├─ Cost Analysis
  ├─ Policy Analysis
  └─ Coordinator
       │
       ▼
   MCP Tool Calls   (only when the reasoning above decides they're needed)
       │
       ▼
   Backend
       │
       ▼
External resources / filesystem / knowledge base
```

The agent isn't following a fixed pipeline of tool calls. It orchestrates MCP tools in whatever order its reasoning demands, evaluates competing options against each other, and explains *why* it rejected the alternatives — not just what it picked. **MCP exposes capability. The Agent Runtime decides when and why to use it.**

---

## 5. Agent Runtime — The AI Layer

### 5.1 Layering Overview

The Agent Runtime is the layer that sits between the LLM and MCP. For this MVP, it is **not** six separate LLM instances or six separate services — it's six **logical reasoning stages** executed by the same underlying LLM, each with its own responsibility, inputs, outputs, and rules about when it's allowed to touch a tool. Structuring the system prompt and shared state this way keeps the reasoning legible and testable now, and makes it straightforward to split any stage into its own call (or its own model) later without changing the contract anything else depends on.

Think of it the way you'd think of a compiler's passes: one binary, but the source goes through distinct, well-defined phases — parsing, type-checking, optimization, codegen — each of which only cares about a slice of the problem and hands off a well-defined artifact to the next.

```
Planner
  ↓
Requirements Extractor
  ↓
Architecture Designer
  ↓
Cost Analyst
  ↓
Policy Validator
  ↓
Coordinator
```

Every stage reads from and writes to the **Shared Agent State** (Section 6). No stage talks to another stage directly — they communicate exclusively through that shared object, the same way independently deployed microservices would communicate through a shared data contract, even though today they're all one process.

### 5.2 The Six Logical Agents

#### Planner

| | |
|---|---|
| **Purpose** | Entry point for every run. Reads the raw prompt and current state, and decides what needs to happen next. |
| **Responsibilities** | Parse the incoming prompt at a high level; check whether the shared state already has enough to proceed (e.g. a resumed session); decide whether to hand off to the Requirements Extractor or to stop and ask the user a clarifying question. |
| **Inputs** | Raw user prompt, `state` (usually empty at session start) |
| **Outputs** | An initial, partially-filled `requirements` object; a `nextStage` directive; or, if the prompt is too vague to proceed at all (e.g. no workload description whatsoever), a clarifying question back to the user |
| **Allowed tool usage** | **None.** The Planner never calls an MCP tool — it reasons only over the prompt and the state object. |
| **Stopping conditions** | Stops and returns to the user if a clarifying question is required. Otherwise hands off to the Requirements Extractor once the prompt has been triaged. |

#### Requirements Extractor

| | |
|---|---|
| **Purpose** | Turn the natural-language prompt into a structured, typed requirements object. |
| **Responsibilities** | Extract `expectedUsers`, `monthlyBudget`, `slaTarget`, `environment`; classify the workload (e.g. cpu-intensive, io-bound, batch, production, medium-scale); flag any field that genuinely cannot be inferred. |
| **Inputs** | Raw prompt, `state.requirements` skeleton from the Planner |
| **Outputs** | A fully populated `requirements` object written into shared state, including `classification` tags |
| **Allowed tool usage** | May call `estimate_resource_requirements` if a rough CPU/memory/RPS estimate is needed to finish classifying the workload. No other tools. |
| **Stopping conditions** | Stops once `requirements` is fully populated, or once it determines a required field is missing and unrecoverable from the prompt alone (hands back to Planner to ask the user). |

#### Architecture Designer

| | |
|---|---|
| **Purpose** | Propose candidate architectures, within the MVP catalog (Section 9), that could plausibly satisfy the requirements. |
| **Responsibilities** | Reason over compute/database/cache/scaling combinations; prune options that are structurally wrong for the workload (e.g. reject Lambda for a long-running CPU-bound job before it ever gets priced); generate exactly 3 structurally distinct candidates so the comparison later is meaningful, not cosmetic. |
| **Inputs** | `state.requirements`; optionally the result of `read_existing_infrastructure` if the workload should integrate with what's already deployed |
| **Outputs** | `state.architecture.candidates` — 3 `ArchitectureCandidate` skeletons (compute/database/cache/scaling/instance type chosen, cost not yet attached) |
| **Allowed tool usage** | `read_existing_infrastructure`, `generate_candidate_architectures`. May call `estimate_resource_requirements` if the Requirements Extractor didn't already. |
| **Stopping conditions** | Stops once exactly 3 meaningfully different candidates exist in state. If the candidate generator returns near-duplicate options, this stage is responsible for re-deriving constraints and trying again — this never becomes a new MCP round-trip, it's pure reasoning over the same tool output. |

#### Cost Analyst

| | |
|---|---|
| **Purpose** | Price every candidate architecture. |
| **Responsibilities** | Look up pricing for every resource in every candidate; compute each candidate's cost breakdown (compute / storage / network egress / other); write `monthlyCost` back onto each candidate. |
| **Inputs** | `state.architecture.candidates` |
| **Outputs** | `state.pricing` (per-candidate cost + breakdown); each candidate's `monthlyCost` field filled in |
| **Allowed tool usage** | `get_cloud_pricing` |
| **Stopping conditions** | Stops once every candidate has a complete cost breakdown. If a pricing lookup fails for a given resource, this stage follows the fallback behavior in Section 23 rather than blocking the whole run. |

#### Policy Validator

| | |
|---|---|
| **Purpose** | Check every priced candidate against company policy. |
| **Responsibilities** | Call `read_company_policies` once; evaluate each candidate against every rule; record a pass/fail with a human-readable label per rule per candidate. |
| **Inputs** | `state.architecture.candidates` (already priced), policy rules |
| **Outputs** | `state.policyResults` — a per-candidate array of `PolicyCheck` objects |
| **Allowed tool usage** | `read_company_policies` |
| **Stopping conditions** | Stops once every candidate — including ones that fail every rule — has a complete policy-check result set. This stage never discards a candidate for failing policy; that judgment call belongs to the Coordinator. |

#### Coordinator

| | |
|---|---|
| **Purpose** | The only stage that produces a final recommendation, and the only stage that talks to the human. This is where "compare and explain" reasoning lives — deliberately, so it's never split across a backend scoring function and an LLM narration with no single owner. |
| **Responsibilities** | Weigh cost, performance, reliability, scalability, policy compliance, and operational complexity (Section 8) using the deterministic scores `compare_architectures` returns; choose the recommended candidate; write a plain-language rejection reason for each alternative; trigger `generate_terraform` for the recommended candidate only; assemble the full `InfrastructureAnalysis` payload and hand it to `present_analysis` so it renders on the dashboard; optionally poll `check_approval_status` so the chat thread can narrate the outcome. |
| **Inputs** | The full shared state: `requirements`, `architecture`, `pricing`, `policyResults` |
| **Outputs** | `state.reasoning.coordinator` (summary bullets + confidence score), `state.approvalStatus`, `state.terraform`, the final chat message to the user |
| **Allowed tool usage** | `compare_architectures`, `generate_terraform`, `present_analysis`, `check_approval_status`. (`submit_approval` and `write_approved_changes` are triggered by the dashboard widget and the approval event respectively — never called directly by the Coordinator.) |
| **Stopping conditions** | Stops — i.e. the workflow pauses — once the analysis has been pushed to the dashboard and is awaiting human approval. Resumes only when polling detects a status change, or the human continues the conversation after approving. |

---

## 6. Shared Agent State

Every reasoning stage in Section 5 reads from and writes to a single shared state object that travels through the whole run. This is what makes the six logical agents feel like one coherent process instead of six independent black boxes: nothing is passed stage-to-stage as an ad-hoc message, everything lands in this object.

**Top-level fields:**

- `requirements` — the structured output of the Requirements Extractor
- `architecture` — the candidate list produced by the Architecture Designer, plus which one is recommended
- `pricing` — per-candidate cost breakdowns from the Cost Analyst
- `policyResults` — per-candidate policy check results from the Policy Validator
- `reasoning` — narration written by each stage, keyed by stage name, plus the Coordinator's final summary and confidence score
- `approvalStatus` — `"pending" | "approved" | "rejected"`, owned by the Coordinator and updated by the approval event
- `terraform` — the generated HCL and which candidate it targets

**Example state object**, mid-run (after Cost Analyst and Policy Validator have run, before the Coordinator has produced a recommendation):

```json
{
  "sessionId": "8f14e45f-ceea-467e-bd9a-6b0b1a1c2f11",
  "requirements": {
    "description": "Build infrastructure for an image-processing backend serving 100,000 users, under ₹35,000/month with 99.9% availability.",
    "expectedUsers": 100000,
    "monthlyBudget": 35000,
    "slaTarget": "99.9%",
    "environment": "prod",
    "classification": ["cpu-intensive", "production", "medium-scale"]
  },
  "architecture": {
    "candidates": [
      { "id": "cand-a", "label": "ECS + PostgreSQL", "compute": "ecs_fargate", "database": "postgresql", "cache": false, "scaling": "auto", "instanceType": "t4g.medium" },
      { "id": "cand-b", "label": "EC2 + Redis", "compute": "ec2", "database": "postgresql", "cache": true, "scaling": "auto", "instanceType": "t3.large" },
      { "id": "cand-c", "label": "EKS", "compute": "eks", "database": "postgresql", "cache": true, "scaling": "auto", "instanceType": "m5.large" }
    ],
    "recommended": null
  },
  "pricing": {
    "cand-a": { "monthlyCost": 29000, "compute": 18000, "storage": 6000, "networkEgress": 3000, "other": 2000 },
    "cand-b": { "monthlyCost": 33000, "compute": 21000, "storage": 6000, "networkEgress": 4000, "other": 2000 },
    "cand-c": { "monthlyCost": 46000, "compute": 30000, "storage": 8000, "networkEgress": 5000, "other": 3000 }
  },
  "policyResults": {
    "cand-a": [ { "label": "Dev Budget Compliant", "passed": true }, { "label": "ARM Supported", "passed": true } ],
    "cand-b": [ { "label": "Dev Budget Compliant", "passed": true }, { "label": "ARM Supported", "passed": false } ],
    "cand-c": [ { "label": "Dev Budget Compliant", "passed": false }, { "label": "ARM Supported", "passed": false } ]
  },
  "reasoning": {
    "architect": ["Rejected Lambda outright — execution-duration limits make it a poor fit for sustained CPU-bound image processing."],
    "cost": [],
    "policy": [],
    "coordinator": []
  },
  "approvalStatus": "pending",
  "terraform": null
}
```

Every reasoning stage updates this object in place before handing off to the next stage; nothing is recomputed from scratch downstream. The Coordinator is the last writer before the object (with `terraform` and `reasoning.coordinator` populated) is handed to `present_analysis` for rendering.

---

## 7. Agent Reasoning Workflow

The workflow is a reasoning loop, not a fixed `Prompt → Tools → Dashboard` pipeline. Tools are called only when a specific reasoning step determines it actually needs external data — not on every step, and not in a hardcoded order.

```
Receive Prompt
      ↓
Understand Requirements
      ↓
Update State
      ↓
Determine Missing Information
      ↓
Call MCP Tools  (only if required)
      ↓
Generate Candidate Architectures
      ↓
Evaluate Tradeoffs
      ↓
Compare Alternatives
      ↓
Choose Recommendation
      ↓
Generate Terraform
      ↓
Pause
      ↓
Human Approval
      ↓
Write Terraform
```

Mapped onto the logical agents from Section 5:

| Workflow step | Owning agent |
|---|---|
| Receive Prompt / Understand Requirements | Planner, Requirements Extractor |
| Update State / Determine Missing Information | Requirements Extractor |
| Call MCP Tools (if required) | Any stage, on demand |
| Generate Candidate Architectures | Architecture Designer |
| Evaluate Tradeoffs | Cost Analyst, Policy Validator |
| Compare Alternatives / Choose Recommendation | Coordinator |
| Generate Terraform | Coordinator (via `generate_terraform`) |
| Pause / Human Approval | Coordinator + Dashboard widget |
| Write Terraform | Triggered by approval event, executed by `write_approved_changes` |

A representative reasoning trace for the story in Section 3:

1. **Understand the workload.** Classify: CPU-intensive, long-running requests, production, medium scale.
2. **Determine infrastructure options.** Consider Lambda, ECS, Kubernetes, EC2. Reason: Lambda's execution limits make it costly for this workload → reject. ECS gives container orchestration with less operational overhead than Kubernetes → select ECS as a candidate.
3. **Estimate required resources.** Requests/sec, CPU, memory, storage growth, network traffic.
4. **Gather external information via MCP, only where needed.** Read existing Terraform, read company policy, query pricing, retrieve available instance types.
5. **Generate multiple candidate architectures**, each fully priced:
   - Option A — ECS + PostgreSQL — ₹29,000/mo
   - Option B — EC2 + Redis — ₹33,000/mo
   - Option C — EKS — ₹46,000/mo
6. **Evaluate tradeoffs.** Option A: cheapest, meets SLA, company-compliant → recommended.
7. **Explain the reasoning in plain language**, e.g.: *"ECS was selected instead of Kubernetes because the workload doesn't require advanced orchestration, reducing operational complexity. ARM-based instances were selected because the application stack supports ARM, cutting compute cost ~25%. Auto Scaling was enabled because traffic is expected to fluctuate during peak hours."*
8. **Generate Terraform** — only now, after the architecture is finalized.
9. **Pause and hand off to a human.** Dashboard shows the selected architecture, alternatives considered, estimated cost, cost breakdown, policy compliance, the AI's reasoning, and a Terraform diff. Developer approves → Terraform is written.

---

## 8. Decision-Making Model

Architectural decisions are not selected arbitrarily, and they are not selected by a hardcoded rule ("always pick cheapest" or "always pick most reliable"). The Coordinator reasons over six factors for every candidate:

| Factor | What it captures |
|---|---|
| **Cost** | Total monthly cost against the stated budget, and cost per unit of capacity |
| **Performance** | Whether the compute/database/cache combination can plausibly meet expected request volume and latency |
| **Reliability** | Whether the candidate meets the stated SLA (e.g. multi-AZ, auto-recovery, managed vs self-managed services) |
| **Scalability** | Whether the candidate has headroom for growth without a re-architecture (fixed vs auto scaling, horizontal vs vertical) |
| **Policy Compliance** | Pass/fail against every rule in `policy.yaml`, as computed by the Policy Validator |
| **Operational Complexity** | How much ongoing operational burden the candidate introduces (e.g. self-managed Kubernetes vs a managed Fargate service) |

The recommendation is the candidate that best satisfies the hard constraints (budget, SLA, policy) while minimizing operational complexity and cost among the remaining options — arrived at by reasoning over these six factors together, not by picking the cheapest candidate that happens to pass policy, and not by picking the "safest-looking" option regardless of cost. The Coordinator's `reasoning.summary` bullets (Section 6) are the human-readable trace of that weighing, and the `rejectionReason` on each alternative exists specifically so the developer can see *which* factor tipped the decision against it.

---

## 9. Hackathon MVP Scope

To keep this achievable in ~14 hours, **do not** try to support the full AWS service catalog. This scope is not a suggestion — treat it as a hard boundary the whole team commits to before writing code:

| Dimension | Allowed options |
|---|---|
| Compute | EC2, ECS Fargate, Lambda |
| Database | PostgreSQL (RDS), DynamoDB |
| Cache | Redis — yes / no |
| Scaling | Fixed vs Auto Scaling |
| Instance types | 3–5 common options (e.g. `t3.medium`, `t3.large`, `t4g.medium`, `m5.large`) |
| Region | Single hardcoded region (e.g. `us-east-1`) — no region selection logic |
| Candidates per run | Exactly 3 (cap it — do not let this grow) |

Hardcode a small knowledge base (pricing + compliance tags) for these options. The Architecture Designer and Coordinator do the reasoning and tradeoff analysis over this fixed catalog — that's what preserves the "agentic" feel without requiring live-pricing calls for every permutation under time pressure.

**Explicitly out of scope for the MVP:** multi-region, live Infracost/AWS pricing API calls per candidate (use the static table), more than 3 candidate architectures, full HCL parsing (regex/marker-block extraction is fine), true-blocking MCP calls (use poll-based approval — see Section 12).

---

## 10. System Architecture

```
┌─────────────┐
│  Developer  │
└──────┬──────┘
       │ prompt
       ▼
┌────────────────────────────────────────┐
│  LLM (Claude / Cursor)                  │
│  — language understanding; drives       │
│    every stage of the Agent Runtime     │
└──────────────────┬───────────────────────┘
                    ▼
┌──────────────────────────────────────────────────┐
│                  AGENT RUNTIME                     │
│   logical reasoning stages, not separate services  │
│   (Section 5) — this is where the intelligence is  │
│                                                     │
│   Planner → Requirements Extractor → Architecture  │
│   Designer → Cost Analyst → Policy Validator →     │
│   Coordinator                                      │
│                                                     │
│   Shared Agent State (Section 6) flows through     │
│   and is updated by every stage above              │
└──────────────────┬─────────────────────────────────┘
                    │  MCP tool calls — only when a
                    │  reasoning stage decides one
                    │  is actually needed
                    ▼
┌──────────────────────────────────────────────────┐
│  NitroStack MCP Server (@nitrostack/core)          │
│  — exposes backend functionality as callable        │
│    tools. Holds no reasoning of its own.            │
│                                                     │
│  @Tool-decorated:                                  │
│   - read_existing_infrastructure                   │
│   - read_company_policies                          │
│   - get_cloud_pricing                              │
│   - estimate_resource_requirements                 │
│   - generate_candidate_architectures                │
│   - compare_architectures                          │
│   - present_analysis   @Widget('arch-dashboard') ◀── UI
│   - generate_terraform                             │
│   - submit_approval        (called BY the widget)  │
│   - check_approval_status                          │
│   - write_approved_changes                          │
└───────────┬───────────────────┬─────────────────────┘
            │                   │
            ▼                   ▼
  ┌──────────────────┐  ┌────────────────────────┐
  │  Backend logic     │  │  Knowledge Base          │
  │  (implemented by   │  │  pricing.json             │
  │  Tracks B & C —    │  │  compute-catalog.json     │
  │  pure functions,   │  │  policy.yaml               │
  │  no AI reasoning)  │  └────────────────────────┘
  └──────────────────┘
            │
            ▼
  ┌──────────────────────┐
  │  Filesystem            │
  │  sample-project/main.tf │
  └──────────────────────┘

  present_analysis's output is rendered inline as the
  Architecture Dashboard Widget (React, @nitrostack/widgets,
  no separate app/port). Approve/Reject on that widget calls
  submit_approval directly through the widget tool-call bridge.
```

**The layering that matters:** LLM, Agent Runtime, MCP, Backend, Knowledge Base, Filesystem, and Dashboard are seven distinct concerns. The Agent Runtime is the only one that reasons. Everything below it — MCP, Backend, Knowledge Base, Filesystem — exists purely to be called *by* that reasoning, on demand, and to hand data back to it.

**Key architectural decision, unchanged from the prior revision:** there is no separate Express bridge or standalone dashboard process. NitroStack lets a React component be attached directly to a tool's output via the `@Widget()` decorator, and that component is rendered inline by the AI client. The widget talks back to the server the same way the agent does — by calling MCP tools — so `submit_approval` is just another `@Tool`, invoked by the widget's Approve/Reject buttons instead of by the agent. The MCP server never writes to disk on its own: `generate_terraform`/`present_analysis` park the pending analysis in an in-memory store, and `write_approved_changes` only fires once `submit_approval` has recorded a decision. The Coordinator can still poll `check_approval_status` if the chat thread should report back once the developer decides (Section 12), but it's no longer required to unblock the UI — the widget already reflects real-time state because it's rendered from live tool output.

---

## 11. Data Flow — Step by Step

1. **Trigger:** Developer prompts the AI: *"Build infrastructure for an image-processing backend serving 100,000 users, under ₹35,000/month with 99.9% availability."*
2. **Planner + Requirements Extractor:** The Agent Runtime classifies the workload and populates `state.requirements` — no tool call needed unless a resource estimate is required.
3. **Architecture Designer:** Reasons over the MVP catalog (Section 9), calling `read_existing_infrastructure` if relevant, and calls `generate_candidate_architectures` to produce exactly 3 structurally distinct, unpriced candidates.
4. **Cost Analyst:** Calls `get_cloud_pricing` per resource per candidate and writes the cost breakdown into `state.pricing`.
5. **Policy Validator:** Calls `read_company_policies` once and writes pass/fail results into `state.policyResults`.
6. **Coordinator — compare:** Calls `compare_architectures` to get deterministic scores (budget/SLA hard checks, policy pass rate, relative cost ranking), then reasons over Section 8's six factors to choose a recommendation and write rejection reasons for the other two.
7. **Coordinator — generate Terraform:** Calls `generate_terraform` for the recommended candidate only (alternatives never get HCL generated, just cost + reasoning).
8. **Coordinator — hand off to the human:** Calls `present_analysis`, which is decorated with `@Widget('arch-dashboard')`, so its return value — the full `InfrastructureAnalysis` payload (Section 18) — is rendered inline by the AI client as the dashboard widget. No bridge, no POST, no WebSocket to wire up. The tool call returns to the agent with a "pushed to dashboard, awaiting approval" message, and the workflow pauses here.
9. **Visual approval:** The widget renders the recommended architecture, the why-panel, the alternatives table, cost breakdown, policy badges, and the Terraform diff. Developer reviews and clicks **Approve**.
10. **Execution:** The widget calls `submit_approval` directly through the `@nitrostack/widgets` tool-call bridge. `write_approved_changes` writes the approved HCL to disk. The AI assistant reports success back in the original chat, optionally after polling `check_approval_status`.

---

## 12. MCP Tools — Full Specification

These are backend capabilities exposed to the Agent Runtime. **The Agent Runtime decides *when* to call these — the tools themselves contain no tradeoff logic, no workload classification, and no recommendation reasoning.** That intelligence lives entirely in Section 5–8.

### `read_existing_infrastructure`

| | |
|---|---|
| **Purpose** | Give the Architecture Designer visibility into what's already deployed, so new resources can integrate with (not duplicate) existing infrastructure. |
| **Called by** | Architecture Designer |
| **Input schema** | `{ "workingDir": string }` |
| **Output schema** | `{ "resources": Array<{ type: string, name: string, attributes: object }> }` |
| **Possible errors** | `DIR_NOT_FOUND`, `NO_TF_FILES`, `PARSE_ERROR` (falls back to treating the project as greenfield) |
| **Example request** | `{ "workingDir": "./sample-project" }` |
| **Example response** | `{ "resources": [{ "type": "aws_vpc", "name": "main", "attributes": { "cidr_block": "10.0.0.0/16" } }] }` |
| **Timeout / assumptions** | 2s timeout; assumes marker-block or regex extraction, not a full HCL parser (Section 9) |

### `read_company_policies`

| | |
|---|---|
| **Purpose** | Give the Policy Validator the current compliance rule set. |
| **Called by** | Policy Validator |
| **Input schema** | `{}` (no arguments) |
| **Output schema** | `{ "rules": Array<{ id: string, label: string, description: string, appliesTo: string[] }> }` |
| **Possible errors** | `POLICY_FILE_MISSING`, `YAML_PARSE_ERROR` (falls back to an empty rule set, all candidates pass by default, and the dashboard flags this explicitly) |
| **Example request** | `{}` |
| **Example response** | `{ "rules": [{ "id": "budget-dev", "label": "Dev Budget Compliant", "description": "Dev environments must stay under ₹10,000/mo", "appliesTo": ["dev"] }] }` |
| **Timeout / assumptions** | 500ms; `policy.yaml` is small (3–5 rules for the MVP) so this is effectively instant |

### `get_cloud_pricing`

| | |
|---|---|
| **Purpose** | Give the Cost Analyst a monthly cost for a specific resource/instance combination. |
| **Called by** | Cost Analyst |
| **Input schema** | `{ "resourceType": "compute" \| "database" \| "cache", "instanceType": string }` |
| **Output schema** | `{ "monthlyCost": number, "unit": string }` |
| **Possible errors** | `UNKNOWN_INSTANCE_TYPE` (not in the static catalog), `UNKNOWN_RESOURCE_TYPE` |
| **Example request** | `{ "resourceType": "compute", "instanceType": "t4g.medium" }` |
| **Example response** | `{ "monthlyCost": 1850, "unit": "INR/month" }` |
| **Timeout / assumptions** | Reads a static JSON file, effectively instant; no live pricing API in the MVP (Section 9) |

### `estimate_resource_requirements`

| | |
|---|---|
| **Purpose** | Turn a workload description and user count into rough capacity numbers the Architecture Designer can size candidates against. |
| **Called by** | Requirements Extractor, Architecture Designer |
| **Input schema** | `{ "workloadDescription": string, "expectedUsers": number }` |
| **Output schema** | `{ "cpu": string, "memory": string, "storageGrowth": string, "expectedRps": number }` |
| **Possible errors** | `INSUFFICIENT_DESCRIPTION` (workload too vague to size — bubbles up to the Planner as a clarifying question) |
| **Example request** | `{ "workloadDescription": "image-processing backend", "expectedUsers": 100000 }` |
| **Example response** | `{ "cpu": "2 vCPU", "memory": "4GB", "storageGrowth": "50GB/month", "expectedRps": 120 }` |
| **Timeout / assumptions** | Simple heuristics, not a simulation — sizing is intentionally rough for the MVP |

### `generate_candidate_architectures`

| | |
|---|---|
| **Purpose** | Produce exactly 3 structurally distinct, unpriced architecture candidates from the MVP catalog. |
| **Called by** | Architecture Designer |
| **Input schema** | `{ "requirements": Requirements, "constraints": { monthlyBudget: number, slaTarget: string, environment: string } }` |
| **Output schema** | `{ "candidates": ArchitectureCandidate[3] }` (unpriced — `monthlyCost` absent) |
| **Possible errors** | `CATALOG_EXHAUSTED` (fewer than 3 meaningfully different combinations fit the constraints — falls back to relaxing the least critical constraint and flagging this in `reasoning`) |
| **Example request** | `{ "requirements": { "classification": ["cpu-intensive", "production"] }, "constraints": { "monthlyBudget": 35000, "slaTarget": "99.9%", "environment": "prod" } }` |
| **Example response** | `{ "candidates": [{ "label": "ECS + PostgreSQL", "compute": "ecs_fargate", "database": "postgresql", "cache": false, "scaling": "auto", "instanceType": "t4g.medium" }, ...] }` |
| **Timeout / assumptions** | Deterministic given the same catalog + constraints; no randomness |

### `compare_architectures`

| | |
|---|---|
| **Purpose** | Deterministic scoring aid for the Coordinator — computes hard budget/SLA pass-fail and relative cost/policy scores. **Does not choose a recommendation and does not write the rejection narration** — that's the Coordinator's reasoning, on top of these scores. |
| **Called by** | Coordinator |
| **Input schema** | `{ "candidates": ArchitectureCandidate[], "policyResults": PolicyCheck[][], "constraints": { monthlyBudget: number, slaTarget: string } }` |
| **Output schema** | `{ "scores": Array<{ candidateId: string, withinBudget: boolean, meetsSla: boolean, policyPassRate: number, relativeCostRank: number }> }` |
| **Possible errors** | `INCOMPLETE_PRICING` (a candidate is missing a cost breakdown), `INCOMPLETE_POLICY_RESULTS` |
| **Example request** | `{ "candidates": [...3 priced candidates...], "policyResults": {...}, "constraints": { "monthlyBudget": 35000, "slaTarget": "99.9%" } }` |
| **Example response** | `{ "scores": [{ "candidateId": "cand-a", "withinBudget": true, "meetsSla": true, "policyPassRate": 1.0, "relativeCostRank": 1 }, ...] }` |
| **Timeout / assumptions** | Pure function over already-computed data; no external calls, effectively instant |

### `present_analysis` — `@Widget('arch-dashboard')`

| | |
|---|---|
| **Purpose** | Package the Coordinator's finished reasoning into the `InfrastructureAnalysis` payload and render it as the dashboard widget. This is the tool the dashboard is attached to — its return value *is* the widget's props. |
| **Called by** | Coordinator, once a recommendation and Terraform have been produced |
| **Input schema** | `InfrastructureAnalysis` (Section 18) minus `status`, `id`, `timestamp` (server-assigned) |
| **Output schema** | The full `InfrastructureAnalysis` object, with `id`, `timestamp`, and `status: "pending"` populated |
| **Possible errors** | `INVALID_PAYLOAD_SHAPE` (Coordinator produced malformed JSON — see Section 23 retry strategy) |
| **Example request** | See Section 18 for the full shape |
| **Example response** | Same shape, with `id: "a1b2c3"`, `timestamp: "2026-07-17T10:15:00Z"`, `status: "pending"` added |
| **Timeout / assumptions** | Writes the analysis into an in-memory pending store; does not touch the filesystem |

### `generate_terraform`

| | |
|---|---|
| **Purpose** | Produce HCL for the recommended candidate only. |
| **Called by** | Coordinator |
| **Input schema** | `{ "candidate": ArchitectureCandidate }` |
| **Output schema** | `{ "hcl": string }` |
| **Possible errors** | `UNSUPPORTED_CANDIDATE_SHAPE` (candidate references a resource combination outside the MVP catalog) |
| **Example request** | `{ "candidate": { "label": "ECS + PostgreSQL", "compute": "ecs_fargate", ... } }` |
| **Example response** | `{ "hcl": "resource \"aws_ecs_service\" \"app\" { ... }" }` |
| **Timeout / assumptions** | Template-based generation, not a general HCL synthesizer; assumes the MVP catalog only |

### `submit_approval`

| | |
|---|---|
| **Purpose** | Record the developer's decision. **Called by the dashboard widget's Approve/Reject buttons — never by the agent itself.** |
| **Called by** | Dashboard widget (via the `@nitrostack/widgets` tool-call bridge) |
| **Input schema** | `{ "analysisId": string, "decision": "approved" \| "rejected" }` |
| **Output schema** | `{ "status": "approved" \| "rejected" }` |
| **Possible errors** | `ANALYSIS_NOT_FOUND`, `ALREADY_DECIDED` |
| **Example request** | `{ "analysisId": "a1b2c3", "decision": "approved" }` |
| **Example response** | `{ "status": "approved" }` |
| **Timeout / assumptions** | Updates the in-memory pending store synchronously |

### `check_approval_status`

| | |
|---|---|
| **Purpose** | Let the Coordinator poll for a decision if the chat thread should narrate the outcome. Optional — not load-bearing for the dashboard itself. |
| **Called by** | Coordinator |
| **Input schema** | `{ "analysisId": string }` |
| **Output schema** | `{ "status": "pending" \| "approved" \| "rejected" }` |
| **Possible errors** | `ANALYSIS_NOT_FOUND` |
| **Example request** | `{ "analysisId": "a1b2c3" }` |
| **Example response** | `{ "status": "pending" }` |
| **Timeout / assumptions** | Polling interval left to the agent; a few-second cadence is plenty for a demo |

### `write_approved_changes`

| | |
|---|---|
| **Purpose** | Write the approved HCL to disk. Only callable once status is `"approved"`. |
| **Called by** | Triggered by the approval event (in practice, invoked right after `submit_approval` records `"approved"`) |
| **Input schema** | `{ "analysisId": string }` |
| **Output schema** | `{ "success": boolean, "filesWritten": string[] }` |
| **Possible errors** | `NOT_APPROVED` (status isn't `"approved"` yet), `WRITE_FAILURE` (disk/permissions issue) |
| **Example request** | `{ "analysisId": "a1b2c3" }` |
| **Example response** | `{ "success": true, "filesWritten": ["sample-project/main.tf"] }` |
| **Timeout / assumptions** | Writes inside a marked block (`# SHIFT-LEFT-FINOPS: managed block start/end`) so repeated writes are idempotent |

---

## 13. AI ↔ Backend Contract

This is the sign-off document between the AI-layer developer (Track A) and the backend developers (Tracks B & C). Full input/output JSON shapes live in Section 12 — this table is the quick-reference contract: what has to be true before a tool is called, and what happens when it fails.

| Tool | Purpose | Called by | Preconditions | Failure response |
|---|---|---|---|---|
| `read_existing_infrastructure` | Surface existing `.tf` resources | Architecture Designer | `workingDir` exists | Empty `resources[]`, treated as greenfield |
| `read_company_policies` | Surface compliance rules | Policy Validator | `policy.yaml` present | Empty `rules[]`, dashboard flags "policy unavailable" |
| `get_cloud_pricing` | Price one resource | Cost Analyst | `instanceType` in static catalog | `UNKNOWN_INSTANCE_TYPE` error, candidate marked unpriceable |
| `estimate_resource_requirements` | Rough capacity sizing | Requirements Extractor, Architecture Designer | Workload description non-empty | `INSUFFICIENT_DESCRIPTION`, bubbles to Planner as clarifying question |
| `generate_candidate_architectures` | Produce 3 unpriced candidates | Architecture Designer | `requirements` fully populated | `CATALOG_EXHAUSTED`, least-critical constraint relaxed and flagged |
| `compare_architectures` | Deterministic scoring | Coordinator | All 3 candidates priced and policy-checked | `INCOMPLETE_PRICING`/`INCOMPLETE_POLICY_RESULTS`, blocks Coordinator until resolved |
| `present_analysis` | Push to dashboard | Coordinator | Recommendation chosen, Terraform generated | `INVALID_PAYLOAD_SHAPE`, retried once with a stricter prompt (Section 23) |
| `generate_terraform` | Emit HCL | Coordinator | Candidate is the chosen recommendation | `UNSUPPORTED_CANDIDATE_SHAPE`, falls back to a minimal skeleton + manual-edit note |
| `submit_approval` | Record human decision | Dashboard widget | `analysisId` exists, status `"pending"` | `ANALYSIS_NOT_FOUND`/`ALREADY_DECIDED` |
| `check_approval_status` | Poll for decision | Coordinator | `analysisId` exists | `ANALYSIS_NOT_FOUND` |
| `write_approved_changes` | Write HCL to disk | Approval event | Status is `"approved"` | `NOT_APPROVED`/`WRITE_FAILURE`, surfaced to chat verbatim |

**Ownership boundary, stated plainly:** the AI layer (Track A) decides *when* each of these is called and *what to do with the result*. Backend (Tracks B & C) owns making each tool return exactly the schema above, correctly, every time — with no tradeoff logic embedded in the tool itself. If a backend tool ever starts making a recommendation-shaped decision (e.g. "this candidate is best"), that logic has leaked out of the Agent Runtime and belongs back in the Coordinator.

---

## 14. Prompt Architecture

The repo previously had a single `prompts/architectAgent.md`. Conceptually, that collapsed six distinct reasoning responsibilities into one undifferentiated prompt. Going forward, each logical agent from Section 5 gets its own prompt specification — **even if the MVP implementation ultimately concatenates them into one system prompt for a single LLM call.** The point of separating them in the design document is that they represent distinct responsibilities with distinct inputs, outputs, and tool permissions; merging them at the prompt-engineering level later is an implementation convenience, not a reason to design them as one thing.

| File | Defines |
|---|---|
| `planner.md` | Triage rules: what counts as "enough information to proceed," when to ask a clarifying question instead of continuing, how to detect a resumed session from existing state |
| `requirements.md` | Extraction rules for `expectedUsers`, `monthlyBudget`, `slaTarget`, `environment`; the workload classification taxonomy; when to call `estimate_resource_requirements` |
| `architect.md` | The MVP catalog (Section 9) as hard constraints; pruning rules (e.g. "reject Lambda for sustained CPU-bound workloads"); the requirement that exactly 3 structurally distinct candidates be produced |
| `cost.md` | How to call `get_cloud_pricing` per resource; how to assemble the `breakdown` object; fallback behavior on a pricing miss |
| `policy.md` | How to call `read_company_policies` and apply each rule per candidate; explicitly forbids discarding a candidate for a policy failure at this stage |
| `coordinator.md` | The six-factor weighing model (Section 8); the rule that `compare_architectures` supplies scores but never a recommendation; the exact `InfrastructureAnalysis` shape `present_analysis` expects; when it's safe to poll `check_approval_status` |

Each file should be short and example-heavy — 1–2 worked examples of good output beats a long abstract description, especially under hackathon time pressure and given the retry strategy in Section 23 depends on tight, predictable output shapes.

---

## 15. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Reasoning / Agent Runtime | LLM (Claude) executing the six logical stages in Section 5, driven by the prompt specs in Section 14 | No hand-coded decision tree — the model does the tradeoff reasoning; this is the actual product |
| MCP Server | NitroStack (`@nitrostack/core`) — decorator-driven tools, DI, auth, middleware | Purpose-built for MCP servers; removes Express-bridge boilerplate and gives us `@Widget` for free. **Purely a capability-exposure layer — see Section 4.** |
| Frontend / UI Widgets | React + TypeScript, built with `@nitrostack/widgets` | Components attach to tool outputs via `@Widget()` and render inline in the AI client — no separate dev server, port, or CORS setup to demo around |
| Styling | Tailwind CSS + glassmorphism utility classes | Rapid iteration, consistent dark-mode tokens |
| Charts | Recharts | Donut/bar cost breakdown with minimal setup |
| Animation | Framer Motion + count-up hook | Smooth number count-up, card transitions |
| Local dev / testing | NitroStudio | Desktop app for hot-reloading widgets, testing tools, and chatting with the server without a real AI client during development |
| Terraform parsing | Regex/marker-block extraction for MVP | Full HCL parsing is a stretch goal |
| Pricing & compliance | Static JSON knowledge base (no live API calls in MVP) | Removes network/API-key risk from the demo entirely |

---

## 16. Repo Structure

```
shift-left-finops/
├── mcp-server/
│   ├── src/
│   │   ├── index.ts                    # MCP server entrypoint + tool registration
│   │   ├── agents/                      # prompt specifications for each logical stage
│   │   │   ├── planner.md
│   │   │   ├── requirements.md
│   │   │   ├── architect.md
│   │   │   ├── cost.md
│   │   │   ├── policy.md
│   │   │   └── coordinator.md
│   │   ├── schemas/
│   │   │   └── state.schema.json        # Shared Agent State (Section 6) as JSON Schema
│   │   ├── contracts/
│   │   │   └── tool-contracts.md        # AI ↔ Backend Contract (Section 13), kept in sync with Section 12
│   │   ├── tools/
│   │   │   ├── tfReader.ts
│   │   │   ├── policyReader.ts
│   │   │   ├── pricingClient.ts
│   │   │   ├── resourceEstimator.ts
│   │   │   ├── candidateGenerator.ts
│   │   │   ├── architectureComparator.ts   # deterministic scoring only — see Section 12
│   │   │   ├── presentAnalysis.ts           # @Widget('arch-dashboard')
│   │   │   └── terraformGenerator.ts
│   │   ├── knowledge-base/
│   │   │   ├── pricing.json              # static instance/db/cache pricing
│   │   │   └── compute-catalog.json      # EC2/ECS/Lambda option definitions
│   │   ├── bridge/
│   │   │   ├── server.ts                 # in-memory pending-analysis store + poll support
│   │   │   ├── routes.ts
│   │   │   ├── store.ts
│   │   │   └── socket.ts
│   │   └── types/
│   │       └── analysis.ts               # shared TS types (mirrored in frontend)
│   ├── policy.yaml
│   └── package.json
│
├── dashboard/                          # React app (rendered as a NitroStack widget)
│   ├── src/
│   │   ├── components/
│   │   │   ├── RecommendedArchitectureCard.tsx
│   │   │   ├── WhyPanel.tsx
│   │   │   ├── AlternativesTable.tsx
│   │   │   ├── ResourceBreakdownChart.tsx
│   │   │   ├── PolicyBadges.tsx
│   │   │   ├── TerraformDiff.tsx
│   │   │   └── ActionZone.tsx
│   │   ├── hooks/
│   │   │   ├── useAnalysisSocket.ts
│   │   │   └── useCountUp.ts
│   │   ├── lib/api.ts
│   │   └── App.tsx
│   └── package.json
│
├── sample-project/                     # demo target repo with dummy .tf files
│   └── main.tf
│
└── docs/
    └── shift-left-finops-docs.md       # this file
```

**Note on `agents/`, `schemas/`, and `contracts/`:** these are new relative to the original layout, and they're where Track A's actual deliverable lives. `agents/*.md` are the prompt specs from Section 14; `schemas/state.schema.json` is the JSON Schema for the object in Section 6; `contracts/tool-contracts.md` is the living version of Section 13, and should be treated as the file backend developers check against when implementing a tool in `tools/`.

---

## 17. Memory & State Lifecycle

**What persists through a single run:** the entire Shared Agent State object (Section 6) — requirements, candidates, pricing, policy results, reasoning narration, approval status, and generated Terraform. It lives in the in-memory pending-analysis store for the duration of one session; there is no cross-session persistence in the MVP (a fresh prompt starts a fresh state object).

**What gets updated, and by whom:**

- `requirements` — written once, by the Requirements Extractor; not modified after
- `architecture.candidates` — written by the Architecture Designer; `monthlyCost` fields are filled in afterward by the Cost Analyst; nothing else mutates a candidate after that
- `policyResults` — written once, by the Policy Validator, after pricing exists
- `reasoning` — appended to by every stage under its own key; never overwritten
- `terraform` — written once, by the Coordinator, only for the recommended candidate
- `approvalStatus` — starts `"pending"`, transitions exactly once to `"approved"` or `"rejected"` via `submit_approval`

**How approval state is maintained:** `approvalStatus` lives on the same in-memory record `present_analysis` created. `submit_approval` is the only tool allowed to change it, and only from `"pending"`. `write_approved_changes` checks this field itself before touching disk — it will not write based on the agent's own belief about the state, only the recorded value, which closes the loop between "the LLM thinks the user approved" and "the user actually clicked Approve."

**How candidate architectures are stored:** all 3 candidates remain in state for the lifetime of the run, even after the Coordinator picks one — the dashboard needs the rejected two for the alternatives table (Section 19), and losing them would make the "why-panel" reasoning unverifiable.

---

## 18. Dashboard Data Contract (Frontend Bridge)

This is the payload `present_analysis` returns and the dashboard widget renders. Shared TypeScript type — put this in both `mcp-server/src/types/analysis.ts` and `dashboard/src/types.ts`:

```typescript
interface InfrastructureAnalysis {
  id: string;                       // uuid, per analysis run
  timestamp: string;                // ISO 8601
  status: "pending" | "approved" | "rejected";

  workload: {
    description: string;            // original prompt text
    classification: string[];       // e.g. ["cpu-intensive", "production", "medium-scale"]
    constraints: {
      monthlyBudget: number;
      slaTarget: string;            // "99.9%"
      environment: "dev" | "staging" | "prod";
    };
  };

  recommended: ArchitectureCandidate;
  alternatives: ArchitectureCandidate[];   // exactly 2 in the MVP (3 candidates total)

  reasoning: {
    summary: string[];              // bullet points, e.g. "ECS selected over Kubernetes because..."
    confidence: number;             // 0-100
  };

  breakdown: {
    compute: number;
    storage: number;
    networkEgress: number;
    other: number;
  };

  policyChecks: PolicyCheck[];
  terraformDiff: string;            // unified diff or plain HCL block to be written
}

interface ArchitectureCandidate {
  label: string;                    // "ECS + PostgreSQL"
  compute: "ec2" | "ecs_fargate" | "lambda";
  database: "postgresql" | "dynamodb";
  cache: boolean;                   // redis yes/no
  scaling: "fixed" | "auto";
  instanceType: string;             // e.g. "t4g.medium"
  monthlyCost: number;
  rejectionReason?: string;         // present only on alternatives, omitted on `recommended`
  hcl?: string;                     // only populated for `recommended`
}

interface PolicyCheck {
  label: string;                    // "Dev Budget Compliant"
  passed: boolean;
}
```

### Reference endpoints (used by the poll/fallback path, not the primary widget path)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/analysis/:id` | Fetch a specific analysis |
| `GET` | `/api/analysis/latest` | Convenience — most recent pending analysis |
| `POST` | `/api/approve` | Body: `{ id, decision: "approved" \| "rejected" }` — advances status, checkable via `check_approval_status` |
| `WS` | `/ws` | Server emits `{ event: "new_analysis", data: InfrastructureAnalysis }` and `{ event: "status_update", id, status }` |

**Contract-first tip, unchanged:** lock this schema in the first 30–45 minutes. Track D builds against a hardcoded mock JSON matching this exact shape while the backend tracks build the real pipeline, and Track A builds the Agent Runtime's `present_analysis` call against the same shape.

---

## 19. Frontend Design Spec

**Visual direction unchanged:** dark-mode glassmorphism. Translucent frosted panels (`backdrop-filter: blur(20px)`), subtle glowing borders, deep navy/charcoal canvas. Green for recommended/compliant, red/amber for rejected/non-compliant.

### Components

**1. Recommended Architecture Card**
- Top of page, full-width glass card
- Shows compute / database / cache / scaling / instance type as a clean spec grid
- Large monthly cost figure with animated count-up on mount
- Confidence score as a circular or linear progress indicator (e.g. "91% confidence") — this is `reasoning.confidence` from the Coordinator, not a generic UI flourish

**2. Why Panel**
- Below the recommended card
- Renders `reasoning.summary` as a checklist of short bullet points, each with a ✓ icon
- e.g. "✓ Meets budget · ✓ Meets SLA · ✓ Lowest operational overhead · ✓ Company policy compliant"
- Keep each bullet to one sentence — this is a glanceable panel, not an essay

**3. Alternatives Table**
- Simple table: Option | Monthly Cost | Why Rejected
- Recommended option not repeated here — this is *only* the 2 rejected candidates, each with the Coordinator's `rejectionReason`
- Muted/greyed styling relative to the recommended card to visually demote it

**4. Resource Breakdown Chart**
- Recharts donut or horizontal bar: Compute / Storage / Network Egress / Other
- Hover tooltip with exact dollar amounts, no cluttered legend

**5. Policy Compliance Badges**
- Row of pill badges, ✅/⚠️
- e.g. "✅ Dev Budget Compliant" · "✅ ARM Supported" · "✅ Auto Scaling Policy Met"

**6. Terraform Diff**
- Collapsible code block (monospace, syntax-highlighted if time allows) showing the HCL that will be written
- Diff-style +/- coloring if there's existing matching state; otherwise just render as a clean "to be added" block

**7. Action Zone**
- Sticky footer: primary "Approve & Write Code" (glowing green), secondary ghost "Reject"
- Clicking either calls `submit_approval` directly (Section 12) — no intermediate REST call in the primary path
- Loading → success checkmark transition, toast confirming the file written

### Design tokens (unchanged)

```css
--bg-canvas: #0a0e17;
--glass-bg: rgba(255, 255, 255, 0.04);
--glass-border: rgba(255, 255, 255, 0.08);
--accent-green: #00e5a0;
--accent-red: #ff6b6b;
--accent-amber: #ffb020;
--text-primary: #f5f7fa;
--text-muted: #8b93a7;
```

```css
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px);
  border-radius: 20px;
}
```

---

## 20. Team Division of Labor

Four tracks, designed to run in parallel from minute 45 onward. **The central change from the original plan: Track A no longer owns "the MCP server" — it owns the AI Layer.** The MCP server is just where Track A's tool-invocation decisions land; the actual deliverable is the reasoning workflow.

### 🟦 Track A — AI Layer (1 person)
**Owns:** `agents/*.md` (prompt specs for all six logical stages), `schemas/state.schema.json`, `contracts/tool-contracts.md`, `mcp-server/src/index.ts` tool registration, the poll-based approval mechanic
- **Agent Architecture:** design and document the six logical stages (Section 5) and how they hand off through Shared Agent State (Section 6)
- **Reasoning Workflow:** implement the loop in Section 7 — this is the actual system prompt, not a wrapper around tool calls
- **Prompt Design:** write `planner.md` through `coordinator.md` (Section 14), example-heavy, tight output schemas
- **Shared State:** own `state.schema.json` and make sure every stage reads/writes it correctly
- **Tool Invocation Logic:** decide, in the prompts, exactly when each MCP tool gets called — and just as importantly, when it doesn't
- **JSON Schemas:** own the `InfrastructureAnalysis` and `ArchitectureCandidate` types (Section 18) jointly with Track D
- **Integration & Coordination with backend:** this person is the glue between B, C, and D — test the *end-to-end reasoning trace* with a scripted prompt early, since this is the piece most likely to have surprising failure modes

### 🟩 Track B — Pricing & Candidate Generation (backend implementation) (1 person)
**Owns:** `tools/pricingClient.ts`, `tools/resourceEstimator.ts`, `tools/candidateGenerator.ts`, `knowledge-base/pricing.json`, `knowledge-base/compute-catalog.json`
- Build the static knowledge base: pricing + compliance tags for the MVP catalog only (3 compute × 2 database × cache toggle × 2 scaling × ~5 instance types — Section 9)
- Implement `estimate_resource_requirements` and `generate_candidate_architectures` exactly to the schemas in Section 12 — no tradeoff reasoning belongs in either function, just data generation
- Compute the `breakdown` object (compute/storage/egress/other split) per candidate
- Hand Track A a clean function signature so it slots directly into the Agent Runtime's tool calls

### 🟨 Track C — Policy Engine, Scoring & Terraform Writer (backend implementation) (1 person)
**Owns:** `tools/policyReader.ts`, `tools/architectureComparator.ts`, `tools/terraformGenerator.ts`, `policy.yaml`, `sample-project/main.tf`
- Write `policy.yaml` with 3–5 rules relevant to the demo story (budget compliance, ARM preference, auto-scaling requirement, etc.)
- Implement `compare_architectures` as a **pure, deterministic scoring function** (Section 12) — hard budget/SLA checks, policy pass rate, relative cost rank. **It must not choose a recommendation or write a rejection narrative — that's the Coordinator's job (Track A), not this tool's.**
- Implement `generate_terraform` and `write_approved_changes` using a clearly marked block (`# SHIFT-LEFT-FINOPS: managed block start/end`) so writes are idempotent
- Build `sample-project/` — a believable existing Terraform repo the live demo modifies

### 🟪 Track D — React Dashboard (1 person, pulls in help from whoever finishes early)
**Owns:** entire `dashboard/` app
- Scaffold the widget with Tailwind and the design tokens from Section 19
- Build all 7 components: Recommended Architecture Card, Why Panel, Alternatives Table, Resource Breakdown Chart, Policy Badges, Terraform Diff, Action Zone
- Build `useAnalysisSocket` (fallback path) and `useCountUp`
- Wire Approve/Reject to call `submit_approval` directly through the widget tool-call bridge
- Build against a hardcoded mock `InfrastructureAnalysis` JSON (matching Section 18 exactly) for the first several hours — do not wait on live data from A/B/C

### Cross-cutting
- **Everyone** agrees on the `InfrastructureAnalysis` schema (Section 18) and the `state.schema.json` shape (Section 6) in the first 30–45 minutes before splitting off.
- Track D commits `mocks/sampleAnalysis.json` early so Track A can point the Agent Runtime's `present_analysis` call at it for the first integration test.
- **The ownership boundary that used to drift, now settled:** "compare and explain" is split by design — `compare_architectures` (Track C) is deterministic scoring only; the recommendation, the confidence score, and the rejection narrative are Coordinator reasoning (Track A). This isn't a mid-build sync point anymore, it's decided in Section 12 — don't relitigate it.
- Integration checkpoint at ~60% through the hackathon to plug all four tracks together before polish time.

---

## 21. Build Timeline (Hackathon)

Assuming a ~14 hour window:

| Time | Milestone |
|---|---|
| 0:00–0:45 | Team syncs on `InfrastructureAnalysis` contract (Section 18) and `state.schema.json` (Section 6), MVP catalog (Section 9) locked, repo scaffolding |
| 0:45–1:30 | Track A gets the reasoning loop running end-to-end with stubbed tool data (even hardcoded fake candidates) — proves the Agent Runtime's shape works before anyone builds the real logic under it |
| 0:45–5:00 | Parallel build: A (prompts + reasoning workflow + tool orchestration), B (pricing/candidates), C (policy/scoring/writer), D (dashboard against mock JSON) |
| 5:00–5:30 | **Checkpoint 1:** A wires B and C's real modules into the Agent Runtime's tool calls; D confirms UI renders correctly against the real schema |
| 5:30–9:00 | Continue building; D consumes live data from `present_analysis`; A/B/C harden the reasoning prompts, candidate diversity, and policy rules |
| 9:00–9:45 | **Checkpoint 2:** Full end-to-end run — prompt the AI, watch it reason through classification → candidates → pricing → policy → recommendation, see the analysis hit the dashboard, click approve, see the file actually written |
| 9:45–12:30 | Polish pass: animations, glassmorphism details, error states, demo script rehearsal |
| 12:30–13:30 | Buffer for bugs, record a backup demo video in case the live demo fails |
| 13:30+ | Final rehearsal, pitch deck / README polish |

---

## 22. Demo Script

1. Show the "before" — a plain `main.tf` and a normal AI chat window.
2. Type: *"Build infrastructure for an image-processing backend serving 100,000 users, under ₹35,000/month with 99.9% availability."*
3. Narrate while the agent works: "It's not writing Terraform yet — it's reasoning through compute options, pricing them, and checking them against policy. Every tool call you'd see in the logs right now was decided on by that reasoning, not by a fixed script."
4. Switch to the dashboard. Point out: the recommended architecture card, the confidence score, the why-panel bullets, the alternatives table showing what was rejected and why, the cost breakdown chart, the policy badges.
5. Open the Terraform diff panel briefly — show it's real HCL, not a mockup.
6. Click **Approve & Write Code** — show the success checkmark.
7. Switch to the editor — show `main.tf` now contains the recommended architecture's actual resources.
8. Close with the line: "The AI didn't just make this cheaper — it considered three real alternatives, explained why it rejected two of them, and only touched the file system after a human saw the reasoning."

---

## 23. Error Handling

| Failure mode | Behavior |
|---|---|
| **Pricing failures** (`UNKNOWN_INSTANCE_TYPE`, catalog miss) | Cost Analyst marks the specific candidate as unpriceable rather than failing the whole run; Coordinator excludes an unpriceable candidate from the recommendation and says why in `reasoning.summary` |
| **Policy failures** (`POLICY_FILE_MISSING`, YAML parse error) | Policy Validator falls back to an empty rule set; dashboard shows an explicit "policy check unavailable" badge instead of silently passing everything |
| **Terraform failures** (`UNSUPPORTED_CANDIDATE_SHAPE`) | `generate_terraform` returns a minimal resource skeleton plus a note for manual completion, rather than blocking the whole approval flow |
| **Invalid LLM output** (Coordinator or any stage emits malformed JSON against its schema) | One automatic retry with a stricter, example-heavy version of that stage's prompt (Section 14); if the retry also fails, surface the raw text to the developer instead of guessing at a repair |
| **Retry strategy** | Retries are scoped to a single stage, not the whole run — a malformed `present_analysis` payload doesn't force re-running pricing or policy checks that already succeeded |
| **Fallback behavior** | Every fallback above is designed to keep the workflow moving and visibly flag the degradation on the dashboard, rather than halting silently or fabricating a confident-looking answer over missing data |

Two additional, environment-level fallbacks carried over from the original plan:

- **MCP polling loop stalls during a live demo:** poll-based approval only (Section 12) — no true-blocking calls in the MVP; keep a manual "force approve" debug endpoint as a demo safety net.
- **Terraform write corrupts the sample file mid-demo:** the marked block (`# SHIFT-LEFT-FINOPS: managed block start/end`) keeps writes idempotent; keep a pristine copy of `sample-project/` to reset via `git checkout --` before each rehearsal.

---

## 24. Stretch Goals

In priority order, only after the MVP loop (Section 9 scope) is fully working:

1. Live pricing (Infracost or AWS Price List API) replacing the static knowledge base.
2. More than 3 candidate architectures, or letting the Architecture Designer decide how many candidates are worth generating.
3. True-blocking MCP call instead of poll-based waiting.
4. Multi-region support.
5. Full HCL parsing via a real parser instead of regex/marker-block extraction.
6. History view — sidebar of past approved/rejected analyses this session.
7. Slack/webhook notification when an analysis is pending.
8. Splitting one or more logical agents (Section 5) into genuinely independent LLM calls, once the shared-state contract has proven stable.

---

## 25. Risks & Fallbacks

| Risk | Fallback |
|---|---|
| A reasoning stage's output is inconsistently formatted JSON | Tight, example-heavy prompt per stage (Section 14) with a strict output schema; single automatic retry (Section 23) rather than hand-fixing every edge case live |
| Team scope-creeps past the MVP catalog (more instance types, more candidates, live pricing) | Re-post Section 9 at the start of every check-in; it's a hard boundary, not a suggestion |
| MCP polling loop stalls during live demo | Poll-based approach only (Section 12) — no true-blocking calls in the MVP; keep a manual "force approve" debug endpoint as a demo safety net |
| WebSocket flakiness on demo WiFi | Dashboard falls back to `setInterval` polling every 2s automatically |
| Terraform write corrupts the sample file mid-demo | Marked block (`# SHIFT-LEFT-FINOPS: managed block start/end`) keeps writes idempotent; keep a pristine copy of `sample-project/` to reset via `git checkout --` before each rehearsal |
| Time runs out before full integration | Track D's dashboard already looks complete against mock data — worst case, demo the UI standalone and narrate the agent's reasoning verbally from a saved transcript |
| "Compare and explain" logic drifts back into the backend tool | Section 12 and Section 20 now state the boundary explicitly — `compare_architectures` stays a pure scoring function; if a PR adds a recommendation field to its output, that's a review-blocking architecture regression, not a style nitpick |

---

*End of document. First concrete action: the 30–45 minute contract sync — lock `InfrastructureAnalysis` (Section 18) and `state.schema.json` (Section 6), confirm the MVP catalog (Section 9), then split into the four tracks.*