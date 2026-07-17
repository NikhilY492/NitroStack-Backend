# Shift-Left FinOps: Autonomous Infrastructure Architect

**Tagline:** Design cloud infrastructure that balances cost, performance, reliability, and compliance — before a single resource is deployed.

**Team size:** 4
**Format:** Hackathon build (~14 hours)
**Stack:** MCP Server (Node/TypeScript) + Express bridge + React frontend + Terraform + static pricing/compliance knowledge base

---

## Table of Contents

1. [Vision](#1-vision)
2. [Problem Statement](#2-problem-statement)
3. [Story](#3-story)
4. [What Makes This an Agent](#4-what-makes-this-an-agent)
5. [Agent Reasoning Process](#5-agent-reasoning-process)
6. [Hackathon MVP Scope](#6-hackathon-mvp-scope)
7. [System Architecture](#7-system-architecture)
8. [Data Flow — Step by Step](#8-data-flow--step-by-step)
9. [MCP Tools](#9-mcp-tools)
10. [Tech Stack](#10-tech-stack)
11. [Repo Structure](#11-repo-structure)
12. [API Contract (The Bridge)](#12-api-contract-the-bridge)
13. [Frontend Design Spec](#13-frontend-design-spec)
14. [Team Division of Labor](#14-team-division-of-labor)
15. [Build Timeline (Hackathon)](#15-build-timeline-hackathon)
16. [Demo Script](#16-demo-script)
17. [Stretch Goals](#17-stretch-goals)
18. [Risks & Fallbacks](#18-risks--fallbacks)

---

## 1. Vision

Today, developers describe what they want to build, but they're still responsible for figuring out *how* to build it on the cloud — EC2 vs ECS vs Lambda, Postgres vs DynamoDB, Redis or not, Spot vs On-Demand, ARM vs x86. That requires cloud expertise, cost estimation, and compliance knowledge most developers don't have time to gather mid-task.

This project turns the AI assistant into an **infrastructure architect**, not a code generator. Given a plain-language description of a workload and its constraints (budget, SLA, environment), the agent reasons through the tradeoffs, generates multiple candidate architectures, prices each one, checks each against company policy, and only *then* proposes Terraform — which a human must review and approve on a dashboard before it's written to disk.

**Terraform is no longer the starting point. It's the final output of a reasoning process.**

---

## 2. Problem Statement

Current AI coding assistants generate infrastructure by making educated guesses. They rarely account for actual workload shape, budget, organizational policy, scalability needs, reliability targets, or real cloud pricing. The result: developers over-provision, violate policy, blow budgets, or burn multiple review cycles with DevOps before something ships.

This system moves those decisions earlier in the development lifecycle — shifting cost and compliance left, into the design conversation itself, instead of catching problems at PR review or on the monthly bill.

---

## 3. Story

**Without the agent:** A developer is asked to build an image-processing service — 100,000 users, ₹35,000/month budget, 99.9% availability, AWS, production. They have to independently decide between Lambda/ECS/Kubernetes, pick a database, decide on caching, size instances, and estimate cost — usually by searching docs and pricing pages — before writing any Terraform. DevOps later rejects the PR for exceeding budget and violating infra guidelines.

**With the agent:** The developer writes one sentence: *"Build infrastructure for an image-processing backend serving 100,000 users, under ₹35,000/month with 99.9% availability."* The agent reasons through workload type, compute options, resource sizing, and policy constraints; gathers pricing and policy data through MCP tools; generates 2–3 candidate architectures; picks and justifies the best one; and pushes the full comparison to a dashboard. The developer reviews the reasoning, the alternatives, and the cost breakdown, then approves. Terraform is written automatically.

---

## 4. What Makes This an Agent

The goal is no longer *"generate Terraform."* The goal is:

> Design infrastructure that satisfies budget, reliability, performance, scalability, and organizational policy — while minimizing monthly cloud cost.

The agent isn't following a fixed pipeline. It orchestrates a set of MCP tools in whatever order the reasoning demands, evaluates competing options against each other, and explains *why* it rejected the alternatives — not just what it picked.

---

## 5. Agent Reasoning Process

A representative reasoning trace for the story above:

1. **Understand the workload.** Classify: CPU-intensive, long-running requests, production, medium scale.
2. **Determine infrastructure options.** Consider Lambda, ECS, Kubernetes, EC2. Reason: Lambda's execution limits make it costly for this workload → reject. ECS gives container orchestration with less operational overhead than Kubernetes → select ECS.
3. **Estimate required resources.** Requests/sec, CPU, memory, storage growth, network traffic.
4. **Gather external information via MCP.** Read existing Terraform, read company policy, query pricing, retrieve available instance types.
5. **Generate multiple candidate architectures**, each fully priced:
   - Option A — ECS + PostgreSQL — ₹29,000/mo
   - Option B — EC2 + Redis — ₹33,000/mo
   - Option C — EKS — ₹46,000/mo
6. **Evaluate tradeoffs.** Option A: cheapest, meets SLA, company-compliant → recommended.
7. **Explain the reasoning in plain language**, e.g.: *"ECS was selected instead of Kubernetes because the workload doesn't require advanced orchestration, reducing operational complexity. ARM-based instances were selected because the application stack supports ARM, cutting compute cost ~25%. Auto Scaling was enabled because traffic is expected to fluctuate during peak hours."*
8. **Generate Terraform** — only now, after the architecture is finalized.
9. **Human approval.** Dashboard shows the selected architecture, alternatives considered, estimated cost, cost breakdown, policy compliance, the AI's reasoning, and a Terraform diff. Developer approves → Terraform is written.

---

## 6. Hackathon MVP Scope

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

Hardcode a small knowledge base (pricing + compliance tags) for these options. The LLM does the reasoning and tradeoff analysis over this fixed catalog — that's what preserves the "agentic" feel without requiring live-pricing calls for every permutation under time pressure.

**Explicitly out of scope for the MVP:** multi-region, live Infracost/AWS pricing API calls per candidate (use the static table), more than 3 candidate architectures, full HCL parsing (regex/marker-block extraction is fine), true-blocking MCP calls (use poll-based approval — see Section 9).

---

## 7. System Architecture

```
┌─────────────┐         ┌──────────────────────┐         ┌────────────────────┐
│  Developer  │  prompt │   AI Assistant        │  MCP    │   MCP Server        │
│  (Claude/   ├────────▶│  (Claude Code, etc.)  ├────────▶│   (Node/TS)         │
│   Cursor)   │         └──────────────────────┘  tools   │                     │
└─────────────┘                                            │  - workload         │
                                                             │    classifier       │
                                                             │  - tf_reader        │
                                                             │  - policy_reader    │
                                                             │  - pricing_client   │
                                                             │  - resource_        │
                                                             │    estimator        │
                                                             │  - candidate_       │
                                                             │    generator        │
                                                             │  - architecture_    │
                                                             │    comparator       │
                                                             │  - terraform_       │
                                                             │    generator        │
                                                             └──────────┬──────────┘
                                                                        │
                                                          POST /analysis (JSON payload:
                                                          recommended + alternatives +
                                                          reasoning + confidence)
                                                                        │
                                                                        ▼
                                                             ┌─────────────────────┐
                                                             │  Express Bridge      │
                                                             │  (co-located w/ MCP  │
                                                             │   server)            │
                                                             │                      │
                                                             │  /api/analysis (GET) │
                                                             │  /api/approve (POST) │
                                                             │  WS: live updates    │
                                                             └──────────┬───────────┘
                                                                        │
                                                              serves + streams to
                                                                        │
                                                                        ▼
                                                             ┌─────────────────────┐
                                                             │  React Dashboard     │
                                                             │  (localhost:5173)    │
                                                             │                      │
                                                             │  Recommended arch,   │
                                                             │  why-panel, alter-   │
                                                             │  natives table,      │
                                                             │  Terraform diff      │
                                                             └──────────┬───────────┘
                                                                        │
                                                             POST /api/approve
                                                                        │
                                                                        ▼
                                                             MCP Server writes .tf
                                                             files to local disk
```

**Key architectural decision unchanged from before:** MCP server and Express bridge share a process (or two localhost processes sharing an in-memory store). The MCP server never writes to disk directly — it parks the full analysis (recommended + alternatives + reasoning) in the bridge's pending-approval store, and the AI assistant polls a status-check tool until a decision is made.

---

## 8. Data Flow — Step by Step

1. **Trigger:** Developer prompts the AI: *"Build infrastructure for an image-processing backend serving 100,000 users, under ₹35,000/month with 99.9% availability."*
2. **Workload classification:** Agent calls a reasoning step (no tool needed, or a lightweight `classify_workload` tool) to tag the workload — CPU-intensive, scale tier, environment.
3. **Context gathering via MCP:** `read_existing_infrastructure`, `read_company_policies`, `get_cloud_pricing` (against the static knowledge base), `estimate_resource_requirements`.
4. **Candidate generation:** `generate_candidate_architectures` returns exactly 3 fully-specified, fully-priced options from the MVP catalog (Section 6).
5. **Comparison:** `compare_architectures` scores each candidate against budget/SLA/policy and returns a recommendation plus rejection reasons for the other two.
6. **Terraform generation:** `generate_terraform` produces the HCL for the *recommended* candidate only (alternatives don't need HCL generated, just cost + reasoning).
7. **Data handoff:** MCP server POSTs the full `InfrastructureAnalysis` payload (Section 12) to the bridge and emits a WebSocket event. Tool call returns to the AI with a "pushed to dashboard, awaiting approval" message.
8. **Visual approval:** Dashboard renders the recommended architecture, the why-panel, the alternatives table, cost breakdown, policy badges, and the Terraform diff. Developer reviews and clicks **Approve**.
9. **Execution:** React POSTs the decision to `/api/approve`. MCP server's `write_approved_changes` tool writes the approved HCL to disk. AI assistant reports success back in the original chat.

---

## 9. MCP Tools

Reasoning tools, not just Terraform tools — the AI orchestrates these in whatever order its reasoning calls for, not a fixed pipeline:

| Tool | Input | Output |
|---|---|---|
| `read_existing_infrastructure` | `{ workingDir }` | Existing resources parsed/extracted from `.tf` files |
| `read_company_policies` | `{}` | Parsed `policy.yaml` rules |
| `get_cloud_pricing` | `{ resourceType, instanceType }` | `{ monthlyCost, unit }` from the static knowledge base |
| `estimate_resource_requirements` | `{ workloadDescription, expectedUsers }` | `{ cpu, memory, storageGrowth, expectedRps }` |
| `generate_candidate_architectures` | `{ requirements, constraints }` | Array of exactly 3 `ArchitectureCandidate` objects, each priced |
| `compare_architectures` | `{ candidates, policies, constraints }` | `{ recommended, alternatives, reasoning, confidence }` |
| `generate_terraform` | `{ candidate }` | HCL string for the recommended candidate |
| `check_approval_status` | `{ analysisId }` | `{ status: "pending" \| "approved" \| "rejected" }` — the AI polls this after pushing |
| `write_approved_changes` | `{ analysisId }` | `{ success, filesWritten }` — only callable once status is `"approved"` |

**Blocking mechanic — unchanged recommendation from the original plan:** use the poll-based approach (`check_approval_status` looped by the AI) as the default, not a true-blocking server call. It's far more demo-robust — a dropped WebSocket or closed browser tab won't hang the whole agent.

---

## 10. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| MCP Server | Node.js + TypeScript, `@modelcontextprotocol/sdk` | Official SDK, first-class tool orchestration |
| Bridge API | Express.js (co-located with MCP server) | Minimal, fast to wire under time pressure |
| Realtime | WebSocket (`ws`) with polling fallback | Push feels premium; polling is the safety net |
| Frontend | React + Vite + TypeScript | Fast dev server, HMR |
| Styling | Tailwind CSS + glassmorphism utility classes | Rapid iteration, consistent dark-mode tokens |
| Charts | Recharts | Donut/bar cost breakdown with minimal setup |
| Animation | Framer Motion + count-up hook | Smooth number count-up, card transitions |
| Terraform parsing | Regex/marker-block extraction for MVP | Full HCL parsing is a stretch goal |
| Pricing & compliance | Static JSON knowledge base (no live API calls in MVP) | Removes network/API-key risk from the demo entirely |
| Agent reasoning | LLM (Claude) orchestrating the MCP tools above via system prompt | No hand-coded decision tree — the model does the tradeoff reasoning |

---

## 11. Repo Structure

```
shift-left-finops/
├── mcp-server/
│   ├── src/
│   │   ├── index.ts                    # MCP server entrypoint + tool registration
│   │   ├── prompts/
│   │   │   └── architectAgent.md       # system prompt driving the reasoning/orchestration
│   │   ├── tools/
│   │   │   ├── tfReader.ts
│   │   │   ├── policyReader.ts
│   │   │   ├── pricingClient.ts
│   │   │   ├── resourceEstimator.ts
│   │   │   ├── candidateGenerator.ts
│   │   │   ├── architectureComparator.ts
│   │   │   └── terraformGenerator.ts
│   │   ├── knowledge-base/
│   │   │   ├── pricing.json            # static instance/db/cache pricing
│   │   │   └── compute-catalog.json    # EC2/ECS/Lambda option definitions
│   │   ├── bridge/
│   │   │   ├── server.ts               # Express app
│   │   │   ├── routes.ts               # /api/analysis, /api/approve
│   │   │   ├── store.ts                # in-memory pending-approval store
│   │   │   └── socket.ts               # WebSocket emit/broadcast
│   │   └── types/
│   │       └── analysis.ts             # shared TS types (mirrored in frontend)
│   ├── policy.yaml
│   └── package.json
│
├── dashboard/                          # React app
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

---

## 12. API Contract (The Bridge)

Shared TypeScript type — put this in both `mcp-server/src/types/analysis.ts` and `dashboard/src/types.ts`:

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

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/analysis/:id` | Fetch a specific analysis |
| `GET` | `/api/analysis/latest` | Convenience — most recent pending analysis |
| `POST` | `/api/approve` | Body: `{ id, decision: "approved" \| "rejected" }` — advances status, checkable via `check_approval_status` |
| `WS` | `/ws` | Server emits `{ event: "new_analysis", data: InfrastructureAnalysis }` and `{ event: "status_update", id, status }` |

**Contract-first tip, unchanged:** lock this schema in the first 30–45 minutes. Track D builds against a hardcoded mock JSON matching this exact shape while the backend tracks build the real pipeline.

---

## 13. Frontend Design Spec

**Visual direction unchanged:** dark-mode glassmorphism. Translucent frosted panels (`backdrop-filter: blur(20px)`), subtle glowing borders, deep navy/charcoal canvas. Green for recommended/compliant, red/amber for rejected/non-compliant.

### Components

**1. Recommended Architecture Card**
- Top of page, full-width glass card
- Shows compute / database / cache / scaling / instance type as a clean spec grid
- Large monthly cost figure with animated count-up on mount
- Confidence score as a circular or linear progress indicator (e.g. "91% confidence")

**2. Why Panel**
- Below the recommended card
- Renders `reasoning.summary` as a checklist of short bullet points, each with a ✓ icon
- e.g. "✓ Meets budget · ✓ Meets SLA · ✓ Lowest operational overhead · ✓ Company policy compliant"
- Keep each bullet to one sentence — this is a glanceable panel, not an essay

**3. Alternatives Table**
- Simple table: Option | Monthly Cost | Why Rejected
- Recommended option not repeated here — this is *only* the 2 rejected candidates
- Muted/greyed styling relative to the recommended card to visually demote it

**4. Resource Breakdown Chart**
- Recharts donut or horizontal bar: Compute / Storage / Network Egress / Other
- Same as prior version — hover tooltip with exact dollar amounts, no cluttered legend

**5. Policy Compliance Badges**
- Row of pill badges, ✅/⚠️, same treatment as before
- e.g. "✅ Dev Budget Compliant" · "✅ ARM Supported" · "✅ Auto Scaling Policy Met"

**6. Terraform Diff**
- Collapsible code block (monospace, syntax-highlighted if time allows) showing the HCL that will be written
- Diff-style +/- coloring if there's existing matching state; otherwise just render as a clean "to be added" block

**7. Action Zone**
- Sticky footer, same as before: primary "Approve & Write Code" (glowing green), secondary ghost "Reject"
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

## 14. Team Division of Labor

Four tracks, designed to run in parallel from minute 45 onward. The biggest change from the original plan: **one track now explicitly owns the agent's system prompt and tool-orchestration behavior** — that's new surface area that didn't exist when the project was just "optimize this Terraform."

### 🟦 Track A — Agent Orchestration & MCP Server (1 person)
**Owns:** `mcp-server/src/index.ts`, `prompts/architectAgent.md`, tool registration, `bridge/store.ts`, `bridge/routes.ts`, the poll-based approval mechanic
- Write the system prompt that drives the agent's reasoning loop — workload classification → context gathering → candidate generation → comparison → Terraform generation → push to dashboard → poll for approval
- Register all 9 tools from Section 9 with the MCP SDK
- Build the Express bridge (in-memory store, `/api/analysis`, `/api/approve`, WebSocket emit)
- Test the *end-to-end tool sequence* with a scripted prompt early — this is the piece most likely to have surprising failure modes, start it first
- Integration point: this person is the glue between B, C, and D

### 🟩 Track B — Pricing & Candidate Generation Engine (1 person)
**Owns:** `tools/pricingClient.ts`, `tools/resourceEstimator.ts`, `tools/candidateGenerator.ts`, `knowledge-base/pricing.json`, `knowledge-base/compute-catalog.json`
- Build the static knowledge base: pricing + compliance tags for the MVP catalog only (3 compute × 2 database × cache toggle × 2 scaling × ~5 instance types — Section 6)
- Implement `estimate_resource_requirements`: given workload description + user count, return rough CPU/memory/RPS estimates (simple heuristics are fine, doesn't need to be sophisticated)
- Implement `generate_candidate_architectures`: return exactly 3 candidates spanning meaningfully different tradeoffs (not 3 near-identical options)
- Compute the `breakdown` object (compute/storage/egress/other split) per candidate
- Hand Track A a clean function signature so it slots directly into the orchestration

### 🟨 Track C — Policy Engine, Comparator & Terraform Writer (1 person)
**Owns:** `tools/policyReader.ts`, `tools/architectureComparator.ts`, `tools/terraformGenerator.ts`, `policy.yaml`, `sample-project/main.tf`
- Write `policy.yaml` with 3–5 rules relevant to the demo story (budget compliance, ARM preference, auto-scaling requirement, etc.)
- Implement `compare_architectures`: score the 3 candidates against budget/SLA/policy, pick a recommendation, and generate a short natural-language `rejectionReason` for each alternative (this can largely be an LLM call with a tight prompt rather than hand-coded scoring logic — coordinate with Track A on whether this lives in the tool or in the agent's own reasoning)
- Implement `generate_terraform` and `write_approved_changes` using a clearly marked block (`# SHIFT-LEFT-FINOPS: managed block start/end`) so writes are idempotent
- Build `sample-project/` — a believable existing Terraform repo the live demo modifies

### 🟪 Track D — React Dashboard (1 person, pulls in help from whoever finishes early)
**Owns:** entire `dashboard/` app
- Scaffold Vite + React + Tailwind with the design tokens from Section 13
- Build all 7 components: Recommended Architecture Card, Why Panel, Alternatives Table, Resource Breakdown Chart, Policy Badges, Terraform Diff, Action Zone
- Build `useAnalysisSocket` (WebSocket + polling fallback) and `useCountUp`
- Wire Approve/Reject to `POST /api/approve`
- Build against a hardcoded mock `InfrastructureAnalysis` JSON (matching Section 12 exactly) for the first several hours — do not wait on live data from A/B/C

### Cross-cutting
- **Everyone** agrees on the `InfrastructureAnalysis` schema (Section 12) in the first 30–45 minutes before splitting off.
- Track D commits `mocks/sampleAnalysis.json` early so Track A can point the bridge at it for the first integration test.
- **New sync point specific to this version:** Track A and Track C should sync mid-build specifically on where "compare and explain" logic lives — inside a single LLM-driven tool call, or split between deterministic scoring (Track C) and reasoning narration (Track A's system prompt). Decide this once, don't let it drift.
- Integration checkpoint at ~60% through the hackathon to plug all four tracks together before polish time.

---

## 15. Build Timeline (Hackathon)

Assuming a ~14 hour window:

| Time | Milestone |
|---|---|
| 0:00–0:45 | Team syncs on `InfrastructureAnalysis` contract (Section 12), MVP catalog (Section 6) locked, repo scaffolding |
| 0:45–1:30 | Track A gets a minimal tool chain running end-to-end with stubbed data (even hardcoded fake candidates) — proves the orchestration shape works before anyone builds the real logic under it |
| 0:45–5:00 | Parallel build: A (prompt + orchestration + bridge), B (pricing/candidates), C (policy/comparator/writer), D (dashboard against mock JSON) |
| 5:00–5:30 | **Checkpoint 1:** A wires B and C's real modules into the tool chain; D confirms UI renders correctly against the real schema |
| 5:30–9:00 | Continue building; D consumes live data from the bridge; A/B/C harden the reasoning prompt, candidate diversity, and policy rules |
| 9:00–9:45 | **Checkpoint 2:** Full end-to-end run — prompt the AI, see the analysis hit the dashboard with recommended + alternatives + reasoning, click approve, see the file actually written |
| 9:45–12:30 | Polish pass: animations, glassmorphism details, error states, demo script rehearsal |
| 12:30–13:30 | Buffer for bugs, record a backup demo video in case the live demo fails |
| 13:30+ | Final rehearsal, pitch deck / README polish |

---

## 16. Demo Script

1. Show the "before" — a plain `main.tf` and a normal AI chat window.
2. Type: *"Build infrastructure for an image-processing backend serving 100,000 users, under ₹35,000/month with 99.9% availability."*
3. Narrate while the agent works: "It's not writing Terraform yet — it's reasoning through compute options, pricing them, and checking them against policy."
4. Switch to the dashboard. Point out: the recommended architecture card, the confidence score, the why-panel bullets, the alternatives table showing what was rejected and why, the cost breakdown chart, the policy badges.
5. Open the Terraform diff panel briefly — show it's real HCL, not a mockup.
6. Click **Approve & Write Code** — show the success checkmark.
7. Switch to the editor — show `main.tf` now contains the recommended architecture's actual resources.
8. Close with the line: "The AI didn't just make this cheaper — it considered three real alternatives, explained why it rejected two of them, and only touched the file system after a human saw the reasoning."

---

## 17. Stretch Goals

In priority order, only after the MVP loop (Section 6 scope) is fully working:

1. Live pricing (Infracost or AWS Price List API) replacing the static knowledge base.
2. More than 3 candidate architectures, or letting the LLM decide how many candidates are worth generating.
3. True-blocking MCP call instead of poll-based waiting.
4. Multi-region support.
5. Full HCL parsing via a real parser instead of regex/marker-block extraction.
6. History view — sidebar of past approved/rejected analyses this session.
7. Slack/webhook notification when an analysis is pending.

---

## 18. Risks & Fallbacks

| Risk | Fallback |
|---|---|
| LLM's candidate/reasoning output is inconsistently formatted JSON | Use a tight, example-heavy system prompt with a strict output schema; add a lightweight validation/retry step in Track A's orchestration rather than trying to hand-fix every edge case live |
| Team scope-creeps past the MVP catalog (more instance types, more candidates, live pricing) | Re-post Section 6 at the start of every check-in; it's a hard boundary, not a suggestion |
| MCP polling loop stalls during live demo | Poll-based approach only (Section 9) — no true-blocking calls in the MVP; keep a manual "force approve" debug endpoint as a demo safety net |
| WebSocket flakiness on demo WiFi | Dashboard falls back to `setInterval` polling every 2s automatically |
| Terraform write corrupts the sample file mid-demo | Marked block (`# SHIFT-LEFT-FINOPS: managed block start/end`) keeps writes idempotent; keep a pristine copy of `sample-project/` to reset via `git checkout --` before each rehearsal |
| Time runs out before full integration | Track D's dashboard already looks complete against mock data — worst case, demo the UI standalone and narrate the agent's reasoning verbally from a saved transcript |

---

*End of document. First concrete action: the 30–45 minute contract sync in Section 14 — lock the `InfrastructureAnalysis` schema and the MVP catalog from Section 6, then split into the four tracks.*
